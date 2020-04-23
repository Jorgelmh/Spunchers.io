import Engine from './Engine.js'

/**
 * ================================
 *      ONLINE GAME ENGINE
 * ================================
 */
export default class Online extends Engine{

    constructor(map, colissionMatrix, tileSet, canvas, socket, playerID, server, skin, name){
        super(map, colissionMatrix, tileSet, canvas, skin)

        this.name = name

        /* Online attributes recevied from the sever */
        this.playerID = playerID
        this.socketIO = socket

        /* Add to emit => the skin */
        this.socketIO.emit('New Player', {
            name: this.name,
            skin: this.skin
        })

        this.state = null
        this.server = server
        this.serverPlayer = null

        /* CALCULATE network speed */
        this.latency = 0

        /* Skins array of images */
        this.onlineSkins = []

        /* SOCKET LISTENERS */
        this.socketIO.on('state', (data) =>{
            this.state = data
            let currentPlayerPos = this.state.players.find((element) => element.playerID === this.playerID)
            this.serverPlayer = currentPlayerPos

            if(currentPlayerPos){
                let startPoints = this.calculateLocalMap(currentPlayerPos.posX, currentPlayerPos.posY)

                this.tileMap.startX = startPoints.posX
                this.tileMap.startY = startPoints.posY
            }
            
        })

        /* When new players enter the lobby, they must load other users skins */
        this.socketIO.on('Load Skins', (data) => {
            data.forEach((value) => {
                if(value != this.skin){
                    this.loadServerSkin(value)
                }
            })
        })

        /* when a new player enters, other people must load his skin */
        this.socketIO.on('Load New Skin', (data) =>{
            let element = this.onlineSkins.find((elem) => elem.src === data.src)
            if(!element && data.src != this.skin){
                this.loadServerSkin(data.src)
            }
        })


        this.socketIO.on('pong', (ms) => {
            this.latency= ms
        })
        setInterval(this.emitPlayerPosition, 1000/60)
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

        this.animateCharacter()
        this.calculateOffset()
        this.drawMap()
        this.drawObjects()
        this.drawOtherPlayers()
        this.drawBullets()

        let playerPosition = this.getPlayerRelativePosition()

        this.context.font = '16px cursive'
        this.context.textAlign = 'center'
        this.context.fillText(this.name, playerPosition.posX + this.tile.width/2, playerPosition.posY - 10)
        this.drawCharacter(playerPosition)

        this.context.fillText(`FPS: ${this.FPS}`, (this.screenTiles.x * this.tile.height) - 100, 50)
        this.context.fillText(`Net: ${this.latency}ms`, (this.screenTiles.x * this.tile.height) - 100, 70)
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
            if(!this.character.moveInterval)
                this.character.onMovingForward()
        }
        

        if(this.controls.goDown){   
            if(!this.character.moveInterval)
                this.character.onMovingBackwards()
        }

        if(this.controls.goRight){
            if(!this.character.moveInterval)
                this.character.onMovingRight()
        }
        
        if(this.controls.goLeft){
            if(!this.character.moveInterval)
                this.character.onMovingLeft()
        }

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
        if(this.state.players && this.state.players.length > 1){
            let otherPlayers = this.state.players.filter((player) => player.playerID !== this.playerID)

            for(let player of otherPlayers){
                
                let characterX = this.transformServerMagnitudesX(player.posX)+this.tileMap.startX
                let characterY = this.transformServerMagnitudesY(player.posY)+this.tileMap.startY

                /* If the character is outside the screen don't draw it */
                if(characterX + this.tile.width >= 0 && characterX < this.tileMap.width && characterY+ this.tile.height >= 0 && characterY < this.tileMap.height && player.character){

                    let skin

                    if(player.skin == this.skin){
                        if(player.shooting)
                            skin = this.character.spriteImages.shooting
                        else
                            skin = this.character.spriteImages.normal
                    }

                    if(skin){
                        this.drawOnlineCharacter({posX: characterX, posY: characterY}, player.character, skin, player.playerName )
                    }
                }
            }
        }
    }

    /* Draws the online players with the info from the server */
    drawOnlineCharacter(player, onlineCharacter, skin, name){

        this.context.textAlign = 'center'
        this.context.fillText(name, player.posX + this.tile.width/2, player.posY - 10)
        this.context.drawImage(skin, onlineCharacter.currentSprite.x * this.character.spriteSheet.width, onlineCharacter.currentSprite.y * this.character.spriteSheet.height
                                , this.character.spriteSheet.width, this.character.spriteSheet.height, player.posX, player.posY, this.tile.width, this.tile.height)
    }

    /* Uses the rule of three mathematica formula to transform values from the server */
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
        this.onlineSkins.push(characterSkin)
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
        let halfServerTileWidth = this.server.width/(this.tileMap.tiles[0].length*2)
        let dirX, dirY
        

        switch (this.character.currentSprite.y){
            case 0:
                dirX = 0
                dirY = 1 
                break
            case 1:
                dirX = -1
                dirY = 0
                break
            case 2:
                dirX = 1
                dirY = 0
                break
            case 3:
                dirY = -1
                dirX = 0
                break
            case 4:
                if(this.character.currentSprite.x == 0){
                    dirX = 1
                    dirY = 0
                }else{
                    dirX = Math.sin(Math.PI / 4)
                    dirY = - Math.sin(Math.PI / 4)
                }
                break

            case 5: 
                if(this.character.currentSprite.x == 0){
                    dirX = -1
                    dirY = 0
                }else{
                    dirX = -Math.sin(Math.PI / 4)
                    dirY = - Math.sin(Math.PI / 4)
                }
                break
            case 6:
                if(this.character.currentSprite.x == 0){
                    dirX = 1
                    dirY = 0
                }else{
                    dirX = Math.sin(Math.PI / 4)
                    dirY = Math.sin(Math.PI / 4)
                }
                break
            case 7:
                if(this.character.currentSprite.x == 0){
                    dirX = -1
                    dirY = 0
                }else{
                    dirX = -Math.sin(Math.PI / 4)
                    dirY = Math.sin(Math.PI / 4)
                }
                break

        }

        let bullet = {
            posX: this.serverPlayer.posX + halfServerTileWidth,
            posY: this.serverPlayer.posY,
            dirX: dirX,
            dirY: dirY
        }

        this.socketIO.emit('shoot', bullet)
    }

}