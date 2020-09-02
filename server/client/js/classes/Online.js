import Engine from './Engine.js'
import OnlineChat from './OnlineChat.js'

/**
 * ================================
 *      ONLINE GAME ENGINE
 * ================================
 */
export default class Online extends Engine{

    constructor(map, colissionMatrix, collisionMatrixObjects, tileSet, canvas, socket, playerID, server, skin, name){
        super(map, colissionMatrix, collisionMatrixObjects, tileSet, canvas, skin)

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

            this.bulletsHTMLElement.innerText = `${this.currentAmmo}/${this.playerAmmunition}`
        })

        /* When the gun is able to shoot */
        this.socketIO.on('able to shoot', (data) => {
            this.playerStats.ableToShoot = true
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
     * Called when the sprites are loaded by the engine
     */ 
    render = (timeSinceLastFrame) => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        let playerPosition = this.getPlayerRelativePosition()

        if(this.playerStats){
            let startPoints = this.calculateLocalMap(this.playerStats.posX, this.playerStats.posY)
            
            setTimeout(() => {
                this.tileMap.startX = startPoints.posX
                this.tileMap.startY = startPoints.posY   
            }, 100)
                         
        }

        this.animateCharacter()
        this.calculateOffset()
        this.drawMap()
        this.drawObjects()
        this.drawOtherPlayers()

        this.context.fillStyle = 'black'
        this.drawBullets()

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

    /* Animating the local character with the info from the server */

    animateCharacter(){
        
        let emitPos = false

        if(this.controls.goUp && this.controls.goLeft){
            if(this.character.currentSprite.y != 5){
                this.character.onMovingStop()
                this.character.onMovingForwardLeft()
            } 
        }

        if(this.controls.goUp && this.controls.goRight){
            if(this.character.currentSprite.y != 4){
                this.character.onMovingStop()
                this.character.onMovingForwardRight()
            } 
        }

        if(this.controls.goDown && this.controls.goRight){
            if(this.character.currentSprite.y != 6){
                this.character.onMovingStop()
                this.character.onMovingBackwardsRight()
            } 
        }

        if(this.controls.goDown && this.controls.goLeft){
            if(this.character.currentSprite.y != 7){
                this.character.onMovingStop()
                this.character.onMovingBackwardsLeft()
            } 
        }

        if(this.controls.goUp){

            emitPos = true

            if(!this.character.moveInterval)
                this.character.onMovingForward()
        }
        

        if(this.controls.goDown){

            emitPos = true

            if(!this.character.moveInterval)
                this.character.onMovingBackwards()
        }

        if(this.controls.goRight){

            emitPos = true

            if(!this.character.moveInterval)
                this.character.onMovingRight()
        }
        
        if(this.controls.goLeft){

            emitPos = true

            if(!this.character.moveInterval)
                this.character.onMovingLeft()
        }

        if(this.playerStats.ableToShoot && this.controls.shoot && !this.chat.active && this.currentAmmo && !this.reloading)
            this.triggerShooting()

        if(emitPos)
            this.emitPlayerPosition()

    }

    /* Send the info back to the server */
    emitPlayerPosition = () =>{
        this.socketIO.emit('movement', {
            id: this.playerID,
            controls: this.controls,
            character: {
                currentSprite: {
                    x: this.character.currentSprite.x,
                    y: this.character.currentSprite.y
                }
            }
        })
    }

    /* Calculates the position of the map in the browser => startX and startY */
    calculateLocalMap(x, y){
        let serverWidth = this.transformServerMagnitudesX(x)
        let serverHeight = this.transformServerMagnitudesY(y)

        let posX = ((this.screenTiles.x * this.tile.width)/2 - this.tile.width/2) - serverWidth
        let posY = ((this.screenTiles.y * this.tile.height)/2 - this.tile.height/2) - serverHeight

        return {
            posX, 
            posY
        }
    }

    /* Loops the other players and calls the drawOnlineCharacter to draw each player with the info from the socket */
    drawOtherPlayers(){
        if(this.state.players){

            for(let playerID in this.state.players){

                    let characterX = (playerID === this.playerID) ? this.transformServerMagnitudesX(this.playerStats.posX)+this.tileMap.startX : this.transformServerMagnitudesX(this.state.players[playerID].posX)+this.tileMap.startX
                    let characterY = (playerID === this.playerID) ? this.transformServerMagnitudesY(this.playerStats.posY)+this.tileMap.startY : this.transformServerMagnitudesX(this.state.players[playerID].posY)+this.tileMap.startY

                    if(playerID === this.playerID)
                        console.log(`${this.playerStats.posX}, ${this.playerStats.posY}`);

                    /* If the character is outside the screen don't draw it */
                    if(characterX + this.tile.width >= 0 && characterX < this.screenTiles.x * this.tile.width && characterY+ this.tile.height >= 0 && characterY < this.screenTiles.y * this.tile.height && this.state.players[playerID].character){

                        let skin

                        if(this.state.players[playerID].skin == this.skin){
                            if(this.state.players[playerID].shooting)
                                skin = this.character.spriteImages.shooting
                            else
                                skin = this.character.spriteImages.normal
                        }else{
                            if(this.state.players[playerID].shooting)
                                skin = this.onlineSkins[this.state.players[playerID].skin].shooting
                            else
                                skin = this.onlineSkins[this.state.players[playerID].skin].normal
                        }

                        if(this.state.players[playerID].life === 0)
                            this.state.players[playerID].character.currentSprite = {x: 1, y: 8}

                        if(skin){
                            this.drawLife(characterX, characterY -6, this.state.players[playerID].life)
                            this.drawOnlineCharacter({posX: characterX, posY: characterY}, this.state.players[playerID].character, skin, this.state.players[playerID].playerName )
                        }
                }
            }
        }
    }

    /* Draws the online players with the info from the server */
    drawOnlineCharacter(player, onlineCharacter, skin, name){

        this.context.textAlign = 'center'
        this.context.fillStyle = 'black'
        this.context.fillText(name, player.posX + this.tile.width/2, player.posY - 10)
        this.context.drawImage(skin, onlineCharacter.currentSprite.x * this.character.spriteSheet.width, onlineCharacter.currentSprite.y * this.character.spriteSheet.height
                                , this.character.spriteSheet.width, this.character.spriteSheet.height, player.posX, player.posY, this.tile.width, this.tile.height)
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
                this.context.beginPath()
                this.context.arc(this.transformServerMagnitudesX(element.posX)+this.tileMap.startX, this.transformServerMagnitudesY(element.posY) +this.tileMap.startY, 5, 0, 2 * Math.PI)
                this.context.fill()
            })
        }
    }

    /* Emit bullet to the server */

    emitBullet(){

        this.socketIO.emit('shoot', {
            shootTime: Date.now() - this.serverDelay
        })
    }

    emitReload(){
        this.socketIO.emit('reload weapon')
    }
}