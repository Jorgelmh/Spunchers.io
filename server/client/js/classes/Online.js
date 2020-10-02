import Engine from './Engine.js'
import OnlineChat from './OnlineChat.js'
import Joystick from './Joystick.js'
import Keyboard from './Keyboard.js'

/**
 * ================================
 *      ONLINE GAME ENGINE
 * ================================
 */
export default class Online extends Engine{

    constructor(map, colissionMatrix, shadowMatrix, tileSet, canvas, socket, playerID, server, skin, name){
        super(map, colissionMatrix, shadowMatrix, tileSet, canvas, skin)

        /* Detect if mobile */
        window.mobileCheck = function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        };

        this.controls = (window.mobileCheck()) ? new Joystick(this.canvas, this.character, this.emitPlayerPosition) : new Keyboard(this.character, this.emitPlayerPosition, this.emitBullet, this.emitReload)

        this.name = name
        this.serverDelay = null

        /* Online attributes recevied from the sever */
        this.playerID = playerID
        this.socketIO = socket

        /* Create a chat room */
        this.chat = new OnlineChat(this.socketIO)

        /* Add to emit => the skin */
        this.socketIO.emit('New Player', {
            name: this.name,
            skin: this.skin,
            character: this.character.currentSprite
        })

        this.state = null
        this.server = server

        /* CALCULATE network speed */
        this.latency = 0

        /* Skins array of images */
        this.onlineSkins = {}

        /* SOCKET LISTENERS */
        this.socketIO.on('state', (data) =>{
            this.state = data
            let currentPlayerPos = this.state.players[this.playerID]
            this.playerStats = currentPlayerPos

            if(this.currentAmmo !== this.playerStats.bulletsCharger){
                this.currentAmmo = this.playerStats.currentAmmo
                this.bulletsHTMLElement.innerText = `${this.currentAmmo}/${this.playerAmmunition}`
            }

            this.serverDelay = Date.now() - data.serverTime
        })

        /* When new players enter the lobby, they must load other users skins and default info about the skin selected */
        this.socketIO.on('Load Skins and ammunition', (data) => {
            data.srcArray.forEach((value) => {
                if(value != this.skin){
                    this.loadServerSkin(value)
                }
            })

            this.playerAmmunition = data.characterInfo.bullets
            this.currentAmmo = this.playerAmmunition
            this.shootingDelay = data.characterInfo.shootingDelay

            this.bulletsHTMLElement.innerText = `${this.currentAmmo}/${this.playerAmmunition}`
        })

        /* when a new player enters, other people must load his skin */
        this.socketIO.on('Load New Skin', (data) =>{
            let element = this.onlineSkins[data.src]
            if(!element && data.src != this.skin)
                this.loadServerSkin(data.src)
            
        })

        this.socketIO.on('Reload Weapon', (data) => {
            this.reloading = false
        })

        /* When the score changes */

        this.socketIO.on('New leaderboard', (data) => {

            let positions = ['trophy', 'medal', 'award']
            let score = document.getElementById('scores')

            score.innerHTML = ''

            data.map((elem, index) => {

                let text = document.createElement('p')
                if(elem.id === this.playerID)
                    text.style.color = '#f0565e'

                let scoreText = `<i class="fas fa-${positions[index]}"></i>.${elem.name}: ${elem.score}`
                text.innerHTML = scoreText

                score.appendChild(text)
            })

        })

        this.socketIO.on('pong', (ms) => {
            this.latency= ms
        })

    }

    /**
     * ==========================
     *      RENDER FUNCTION
     * ==========================
     * 
     * Called once sprites are loaded by the engine
     */ 
    render = (timeSinceLastFrame) => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        if(this.playerStats)
            this.calculateLocalMap()


        this.animateCharacter()
        this.calculateOffset()
        this.drawMap()
        this.drawShadows()
        this.drawObjects()
        this.drawBullets()
        this.drawOtherPlayers()

        if(window.mobileCheck())
            this.controls.drawJoystick()

        this.context.font = '16px cursive'
        this.context.fillStyle = 'black'

        //this.drawCharacter()

        this.context.fillStyle = "black"
        this.context.fillText(`FPS: ${this.FPS}`, (this.screenTiles.x * this.tile.height) - 100, 50)
        this.context.fillText(`Net: ${this.latency}ms`, (this.screenTiles.x * this.tile.height) - 100, 70)

        if(this.reloading || this.currentAmmo === 0){
            this.context.textAlign = 'center'
            this.context.fillText('Reloading...',(this.screenTiles.x * this.tile.width)/2, this.canvas.height - 10)
        }
            
        requestAnimationFrame(() => {

            /* FPS Counter */
            let now = new Date()
            timeSinceLastFrame = this.lastFrameTime ? (now - this.lastFrameTime): 0
                
            this.render(timeSinceLastFrame)

            this.lastFrameTime = now
            this.FPS = Math.floor(1/(timeSinceLastFrame/1000)) 
        })
    }

    animateCharacter(){
        this.controls.animate()
        if(this.ableToShoot && this.controls.shoot && !this.chat.active && this.currentAmmo && !this.reloading)
            this.triggerShooting()

    }

    /* Send data back to the server */
    emitPlayerPosition = (movement) =>{
        this.socketIO.emit('movement', {
            movement,
            cartisianMovement: this.controls.cartesianValueOfMovement,
            character: {
                currentSprite: this.character.currentSprite
            }
        })
    }

    /* Calculates the position of the map in the browser => startX and startY */
    calculateLocalMap(){
        let serverWidth = this.transformServerMagnitudesX(this.playerStats.posX)
        let serverHeight = this.transformServerMagnitudesY(this.playerStats.posY)

        /* X axis smoothness */
        if(this.cameraSmoothness.offsetX < this.cameraSmoothness.limitX && this.cameraSmoothness.offsetX > -this.cameraSmoothness.limitX && this.playerStats.cartesianValueOfMovement.x){
            this.cameraSmoothness.velX = (this.cameraSmoothness.velX > 1.8) ? 2 : this.cameraSmoothness.velX / this.cameraSmoothness.friction
            this.cameraSmoothness.offsetX += this.cameraSmoothness.velX *(this.playerStats.cartesianValueOfMovement.x)
        }

        else if(this.playerStats.cartesianValueOfMovement.x === 0 && this.cameraSmoothness.offsetX !== 0){
            this.cameraSmoothness.velX = (this.cameraSmoothness.velX <= .4) ? .4 : this.cameraSmoothness.velX * this.cameraSmoothness.friction
            if(this.cameraSmoothness.offsetX < 0)
                this.cameraSmoothness.offsetX += this.cameraSmoothness.velX
            else
                this.cameraSmoothness.offsetX -= this.cameraSmoothness.velX
        }

        /* Y axis smootheness */
        if(this.cameraSmoothness.offsetY < this.cameraSmoothness.limitX && this.cameraSmoothness.offsetY > -this.cameraSmoothness.limitX && this.playerStats.cartesianValueOfMovement.y){
            this.cameraSmoothness.velY = (this.cameraSmoothness.velY > 1.7) ? 2 : this.cameraSmoothness.velY / this.cameraSmoothness.friction
            this.cameraSmoothness.offsetY += this.cameraSmoothness.velY *(this.playerStats.cartesianValueOfMovement.y * -1)
        }
        else if(this.playerStats.cartesianValueOfMovement.y === 0 && this.cameraSmoothness.offsetY !== 0){
            this.cameraSmoothness.velY = (this.cameraSmoothness.velY <= .4) ? .4 : this.cameraSmoothness.velY * this.cameraSmoothness.friction

            if(this.cameraSmoothness.offsetY < 0)
                this.cameraSmoothness.offsetY += this.cameraSmoothness.velY
            else
                this.cameraSmoothness.offsetY -= this.cameraSmoothness.velY
        }
            
        /* Offset smooth camera */

        this.tileMap.startX = ((this.screenTiles.x * this.tile.width)/2 - this.tile.width/2) - serverWidth + this.cameraSmoothness.offsetX
        this.tileMap.startY = ((this.screenTiles.y * this.tile.height)/2 - this.tile.height/2) - serverHeight + this.cameraSmoothness.offsetY

    }

    /* Loops server players and calls the drawOnlineCharacter to draw each player with the data from the socket */
    drawOtherPlayers(){
        if(this.state.players){

            let quitePlayers = false
            for(let playerID in this.state.players){

                    let characterX = this.transformServerMagnitudesX(this.state.players[playerID].posX)+this.tileMap.startX
                    let characterY = this.transformServerMagnitudesY(this.state.players[playerID].posY)+this.tileMap.startY

                    /* If the character is outside the screen don't draw it */
                    if(characterX + this.tile.width >= 0 && characterX < this.screenTiles.x * this.tile.width && characterY+ this.tile.height >= 0 && characterY < this.screenTiles.y * this.tile.height && this.state.players[playerID].character){

                        let skin

                        if(this.state.players[playerID].skin == this.skin){
                            if(this.state.players[playerID].shooting && this.state.players[playerID].life > 0)
                                skin = this.character.spriteImages.shooting
                            else
                                skin = this.character.spriteImages.normal
                        }else{
                            if(this.state.players[playerID].shooting && this.state.players[playerID].life > 0)
                                skin = this.onlineSkins[this.state.players[playerID].skin].shooting
                            else
                                skin = this.onlineSkins[this.state.players[playerID].skin].normal
                        }

                        if(this.state.players[playerID].life === 0){
                            let tempFlip = this.state.players[playerID].character.currentSprite.flip
                            this.state.players[playerID].character.currentSprite = {x: 0, y: 6, flip: tempFlip}
                        }


                        /* Check if any player is still */
                        if(this.state.players[playerID].still)
                            quitePlayers = true

                        if(skin){
                            this.drawLife(characterX, characterY -6, this.state.players[playerID].life)
                            let character = {
                                y: this.state.players[playerID].character.currentSprite.y,
                                x: (this.state.players[playerID].still && this.state.players[playerID].life > 0) ? this.staticAnimation.x : this.state.players[playerID].character.currentSprite.x,
                                flip: this.state.players[playerID].character.currentSprite.flip
                            }
                            this.drawOnlineCharacter({posX: characterX, posY: characterY}, character , skin, this.state.players[playerID].playerName )
                        }
                }
            }

            if(quitePlayers && !this.staticAnimation.interval)
                this.setAnimationWhenStatic()
            else if (!quitePlayers)
                this.endAnimationWhenStatic()
        }
    }

    /* Draws online players from server's data */
    drawOnlineCharacter(player, onlineCharacter, skin, name){

        this.context.textAlign = 'center'
        this.context.fillStyle = 'black'
        this.context.fillText(name, player.posX + this.tile.width/2, player.posY - 10)
        this.context.save()
        this.context.scale(onlineCharacter.flip, 1)

        let posX = (onlineCharacter.flip === 1) ?  player.posX : player.posX * onlineCharacter.flip - this.tile.width
        
        this.context.drawImage(skin, onlineCharacter.x * this.character.spriteSheet.width, onlineCharacter.y * this.character.spriteSheet.height
                                , this.character.spriteSheet.width, this.character.spriteSheet.height, posX, player.posY, this.tile.width, this.tile.height)
        this.context.restore()
    }

    /* Uses the rule of three mathematic formula to transform values from the server */
    transformServerMagnitudesX(serverValue){
        return (this.tileMap.width * serverValue) / this.server.width
    }

    transformServerMagnitudesY(serverValue){
        return (this.tileMap.height * serverValue) / this.server.height
    }

    /* Load new skin from the server */

    loadServerSkin(src){
        let characterSkin = new Image()
        characterSkin.src = `../assets/characters/${src}.png`

        let shootingSkin = new Image()
        shootingSkin.src = `../assets/characters/shooting/${src}.png`

        this.onlineSkins[src] = {
            normal: characterSkin,
            shooting: shootingSkin
        }
    }

    /** 
     * =========================
     *      Bullet Mechanics
     * =========================
    */

    /* Draw bullets contain on the server */

    drawBullets(){

        if(this.state.bullets.length > 0){
            this.state.bullets.map((element) => {

                let bulletX = this.transformServerMagnitudesX(element.posX)+this.tileMap.startX
                let bulletY = this.transformServerMagnitudesY(element.posY)+this.tileMap.startY

                if(bulletX >= 0 && bulletX < this.screenTiles.x * this.tile.width && bulletY >= 0 && bulletY < this.screenTiles.y * this.tile.height){
                    this.context.save()
                    this.context.scale(element.flip, 1)
    
                    let posX = (element.flip === 1) ? bulletX : bulletX  * element.flip

                    let spritePosX = 0
                    let spritePosY = element.spriteY * 16

                    if(element.spriteY === 0){
                        spritePosX+=5
                        posX-=(this.canvas.width*.005)
                    }
                    else if(element.spriteY === 1)
                        posX-=(this.canvas.width*.015)
                    else if(element.spriteY === 2)
                        bulletY-=(this.canvas.width * .01)
    
                    this.context.drawImage(this.bulletSprite.img, spritePosX, spritePosY, 16, 16, 
                        posX,  bulletY, this.bulletSprite.width, this.bulletSprite.height)

                    this.context.restore()
                    
                    
                    /* Draw actual trayectory of the bullet */
                    /*
                    this.context.beginPath()
                    this.context.arc(this.transformServerMagnitudesX(element.posX)+this.tileMap.startX, this.transformServerMagnitudesY(element.posY) +this.tileMap.startY, 5, 0, 2 * Math.PI)
                    this.context.fill()
                    */
                }
            })
        }
    }

    /* Emit bullet to server */

    emitBullet(){

        this.socketIO.emit('shoot', {
            shootTime: Date.now() - this.serverDelay
        })
    }

    emitReload(){
        if(this.currentAmmo !== this.playerAmmunition){
            this.reloading = true
            this.socketIO.emit('reload weapon')
        }
    }
}