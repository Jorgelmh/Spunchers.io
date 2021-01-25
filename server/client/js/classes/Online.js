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

    constructor(map, colissionMatrix, shadowMatrix, tileSet, canvas, socket, playerID, server, skin, name, game){
        super(map, colissionMatrix, shadowMatrix, tileSet, canvas, skin)

        this.controls = (window.mobileCheck()) ? new Joystick(this.canvas, this.character, this.emitPlayerPosition, this.triggerShooting) : new Keyboard(this.character, this.emitPlayerPosition, this.triggerShooting, this.emitReload, this.playerStats)

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
            character: this.character.currentSprite,
            game
        })

        this.state = null
        this.server = server

        /* CALCULATE network speed */
        this.latency = 0

        /* Skins array of images */
        this.onlineSkins = {}

        /* Check change on cartesian value of movement */
        this.cartesianChange = {
            x: false,
            y: false
        }

        /* Buffer for interpolated state */
        this.buffer = []
        this.lastInterpolation = 0

        /* Constant of interpolation delay */
        this.interpolationDelay = 19

        /* Auto-regulate the interpolationDelay based on users connection */
        this.canRegulateDelay = false
        
        /* SOCKET LISTENERS */
        this.socketIO.on('state', (data) =>{

            if(this.lastInterpolation === 0){
                this.state = data
                this.updateState()
            }

            this.buffer.push(data)

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

        /* Scores from a team based lobby */
        this.socketIO.on('New teams leaderboard', (data)=>{
            document.getElementById('fbi-score').innerHTML = data.team1
            document.getElementById('gambinos-score').innerHTML = data.team2
        })

        this.socketIO.on('pong', (ms) => {
            this.latency= ms
        })

        /* Play sound effect */
        this.socketIO.on('Bullet sound', ({bullet, sound}) => {

            let distanceFromGunshot = Math.floor(Math.sqrt(Math.pow(this.playerStats.posX - bullet.x,2) + (Math.pow(this.playerStats.posY - bullet.y,2))))

            if(distanceFromGunshot <= this.soundWaveRadius && !window.mobileCheck()){
                if(!this.sounds[sound].paused)
                    this.sounds[sound].currentTime = 0
            
                this.sounds[sound].volume = 1 - distanceFromGunshot/this.soundWaveRadius
                this.sounds[sound].play()
            }
            
        })

        /* Still players animation */
        this.lastStillUpdate = Date.now()

        setTimeout(()=> this.canRegulateDelay = true, 1000)

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

        this.interpolate()

        if(this.playerStats)
            this.calculateLocalMap()
        
        this.calculateOffset()
        this.drawMap()
        this.drawShadows()
        this.drawObjects()
        this.drawBullets()
        this.drawOtherPlayers()

        this.controls.animate()

        this.context.font = '16px cursive'
        this.context.fillStyle = 'black'

        if(Date.now() - this.lastStillUpdate >= this.character.animationSpeed){

            this.staticAnimation.x ++

            if(this.staticAnimation.x === 3) 
                this.staticAnimation.x = 0

            this.lastStillUpdate = Date.now()
        }

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

    /** 
    *  ============================
    *       INTERPOLATE STATE
    *  ============================
    */

    interpolate(){

        if(Date.now() - this.lastInterpolation >= this.interpolationDelay && this.buffer.length){
            this.lastInterpolation = Date.now()
            /* Dequeue from buffer */
            this.state = this.buffer[0]
            this.buffer.splice(0, 1)
            
            this.updateState()
        }

        console.log(`${this.buffer.length} , ${this.interpolationDelay}`);

        if(this.canRegulateDelay){
            if(this.buffer.length === 0)
            this.interpolationDelay ++

            if(this.buffer.length >= 5){
                this.buffer.splice(0, this.buffer.length - 3)
                this.interpolationDelay -= 4
            }
        }
        
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

        else if(((this.playerStats.cartesianValueOfMovement.x > 0 && this.cameraSmoothness.offsetX < 0) || (this.playerStats.cartesianValueOfMovement.x < 0 && this.cameraSmoothness.offsetX > 0) 
        || (this.playerStats.cartesianValueOfMovement.x === 0)) && this.cameraSmoothness.offsetX !== 0){

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
        else if(((this.playerStats.cartesianValueOfMovement.y < 0 && this.cameraSmoothness.offsetY < 0) || (this.playerStats.cartesianValueOfMovement.y > 0 && this.cameraSmoothness.offsetY > 0) 
        || (this.playerStats.cartesianValueOfMovement.y === 0)) && this.cameraSmoothness.offsetY !== 0){
            this.cameraSmoothness.velY = (this.cameraSmoothness.velY <= .4) ? .4 : this.cameraSmoothness.velY * this.cameraSmoothness.friction

            if(this.cameraSmoothness.offsetY < 0)
                this.cameraSmoothness.offsetY += this.cameraSmoothness.velY
            else
                this.cameraSmoothness.offsetY -= this.cameraSmoothness.velY
        }
            
        //console.log(`x: ${this.cameraSmoothness.offsetX}, y: ${this.cameraSmoothness.offsetY}`)
        /* Offset smooth camera */

        this.tileMap.startX = ((this.screenTiles.x * this.tile.width)/2 - this.tile.width/2) - serverWidth + this.cameraSmoothness.offsetX
        this.tileMap.startY = ((this.screenTiles.y * this.tile.height)/2 - this.tile.height/2) - serverHeight + this.cameraSmoothness.offsetY

    }

    /* Loops server players and calls the drawOnlineCharacter to draw each player with the data from the socket */
    drawOtherPlayers(){
        if(Array.isArray(this.state.players)){
            let colors = (this.state.players[0][this.playerID]) ? [this.colors.ally, this.colors.enemy] : [this.colors.enemy, this.colors.ally]

            this.drawPlayers(this.state.players[0], colors[0])
            this.drawPlayers(this.state.players[1], colors[1])

        }else{
            this.drawPlayers(this.state.players)
        }

    }

    drawPlayers(players, lifeColor = this.colors.enemy){

        let quitePlayers = false

        for(let playerID in players){

            let characterX = this.transformServerMagnitudesX(players[playerID].posX)+this.tileMap.startX
            let characterY = this.transformServerMagnitudesY(players[playerID].posY)+this.tileMap.startY

            /* If the character is outside the screen don't draw it */
            if(characterX + this.tile.width >= 0 && characterX < this.screenTiles.x * this.tile.width && characterY+ this.tile.height >= 0 && characterY < this.screenTiles.y * this.tile.height && players[playerID].character){

                let skin = (players[playerID].skin == this.skin) ? this.character.spriteSheet.img : this.onlineSkins[players[playerID].skin]
                      
                /* Check if any player is still */
                if(players[playerID].still && players[playerID].life > 0)
                    quitePlayers = true
                
                if(players[playerID].character.currentSprite.x % 2 ==1 && !players[playerID].still && !window.mobileCheck())
                    this.sounds.footstep.play()

                if(skin){
                    let color = (playerID === this.playerID) ? this.colors.self : lifeColor
                    this.drawLife(characterX, characterY -6, players[playerID].life, color)

                    let character = {
                        flip: (players[playerID].character.currentSprite.y === 0 || players[playerID].character.currentSprite.y === 2) ? 1 : players[playerID].character.currentSprite.flip,
                        y: (players[playerID].shooting && players[playerID].life > 0) ? players[playerID].character.currentSprite.y + 6 : players[playerID].character.currentSprite.y,
                        x: (players[playerID].still && players[playerID].life > 0) ? this.staticAnimation.x : players[playerID].character.currentSprite.x,
                    }
                    this.drawOnlineCharacter({posX: characterX, posY: characterY}, character , skin, players[playerID].playerName)
                }
            }
        }

        return quitePlayers
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

        this.onlineSkins[src] = characterSkin
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

    /** Update state */
    updateState(){

        this.playerStats = (Array.isArray(this.state.players)) ? this.state.players[0][this.playerID] || this.state.players[1][this.playerID] 
                            : this.state.players[this.playerID]

        if(this.playerStats){
            if(this.currentAmmo !== this.playerStats.bulletsCharger){
                this.currentAmmo = this.playerStats.currentAmmo
                this.bulletsHTMLElement.innerText = `${this.currentAmmo}/${this.playerAmmunition}`
            }
            /* Check if the player is reloading */
            this.reloading = this.playerStats.reloading
        }
    }

    /* Emit bullet to server */

    emitBullet(dir, spriteY){

        this.socketIO.emit('shoot', {
            bullet: {
                dir,
                spriteY
            },
            shootTime: Date.now() - this.serverDelay
        })
    }

    emitReload = () => {

        if(this.currentAmmo !== this.playerAmmunition && !this.reloading){
            this.reloading = true
            this.socketIO.emit('reload weapon')
        }
    }
}