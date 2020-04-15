import Engine from './Engine.js'

/**
 * ================================
 *      ONLINE GAME ENGINE
 * ================================
 */
export default class Online extends Engine{

    constructor(map, colissionMatrix, tileSet, canvas, socket, playerID, server){
        super(map, colissionMatrix, tileSet, canvas)

        this.playerID = playerID
        this.socketIO = socket
        this.socketIO.emit('New Player')

        this.state = null
        this.server = server

        /* SOCKET LISTENERS */

        this.socketIO.on('state', (data) =>{
            this.state = data
            let currentPlayerPos = data.find((element) => element.playerId === this.playerID)

            if(currentPlayerPos){
                let startPoints = this.calculateLocalMap(currentPlayerPos.posX, currentPlayerPos.posY)

                this.tileMap.startX = startPoints.posX
                this.tileMap.startY = startPoints.posY
            }
            
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
        this.drawCharacter(this.getPlayerRelativePosition())

        this.context.fillText(`FPS: ${this.FPS}`, this.tileMap.width - 100, 50)
        requestAnimationFrame(() => {

            /* FPS Counter */
            let now = new Date()
            timeSinceLastFrame = this.lastFrameTime ? (now - this.lastFrameTime): 0
                
            this.render(timeSinceLastFrame)

            this.lastFrameTime = now
            this.FPS = Math.floor(1/(timeSinceLastFrame/1000)) 
        })
    }

    /* Animating the character with the info from the server */

    animateCharacter(){
        
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

    emitPlayerPosition = () =>{
        this.socketIO.emit('movement', {
            id: this.playerID,
            controls: this.controls
        })
    }

    calculateLocalMap(x, y){
        let serverWidth = this.transformServerMagnitudes(x)
        let serverHeight = this.transformServerMagnitudes(y)

        let posX = (this.tileMap.width/2 - this.tile.width/2) - serverWidth
        let posY = (this.tileMap.height/2 - this.tile.height/2) - serverHeight

        return {
            posX, 
            posY
        }
    }

    drawOtherPlayers(){
        if(this.state && this.state.length > 1){
            let otherPlayers = this.state.filter((player) => player.playerId !== this.playerID)

            for(let player of otherPlayers){
                
                let characterX = this.transformServerMagnitudes(player.posX)+this.tileMap.startX
                let characterY = this.transformServerMagnitudes(player.posY)+this.tileMap.startY

                if(characterX >= 0 && characterX < this.tileMap.width && characterY >= 0 && characterY < this.tileMap.height)
                    this.drawCharacter({posX: characterX, posY: characterY} )
            }
        }
    }

    transformServerMagnitudes(serverValue){
        return (this.tileMap.width * serverValue) / this.server.width
    }

}