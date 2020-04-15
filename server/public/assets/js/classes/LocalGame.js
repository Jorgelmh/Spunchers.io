import Engine from './Engine.js'

/**
     * ==============================
     *          LOCAL GAME
     * ==============================
     */
export default class LocalGame extends Engine{
    
        constructor(map, colissionMatrix, tileSet, canvas){

            /* Call the constructor of the parent class giving the data to create the MAP */
            super(map, colissionMatrix, tileSet, canvas)
        }

        render = (timeSinceLastFrame) =>{
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            /*  
                Draw the a rectangle surrounding the screen

                this.context.beginPath()
                this.context.rect(this.tileMap.startX, this.tileMap.startY, this.tileMap.width, this.tileMap.height)
                this.context.stroke()
            */

            /* If local change the values if not wait for the server */
            this.animateCharacter()
            this.calculateOffset()
            this.drawMap()
            this.drawObjects()
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

        /* Change the position of the map when listeners are triggered */

        animateCharacter(){
        
            if(this.controls.goUp){
                let oldPosition = this.tileMap.startY
                this.tileMap.startY ++
    
                if(this.detectColissions())
                    this.tileMap.startY = oldPosition
    
                if(!this.character.moveInterval)
                    this.character.onMovingForward()
            }
            
    
            if(this.controls.goDown){
    
                let oldPosition = this.tileMap.startY
                this.tileMap.startY --
    
                if(this.detectColissions())
                    this.tileMap.startY = oldPosition
                
                if(!this.character.moveInterval)
                    this.character.onMovingBackwards()
            }
    
            if(this.controls.goRight){
    
                let oldPosition = this.tileMap.startX
                this.tileMap.startX --
    
                if(this.detectColissions())
                    this.tileMap.startX = oldPosition
                
                if(!this.character.moveInterval)
                    this.character.onMovingRight()
            }
            
            if(this.controls.goLeft){
    
                let oldPosition = this.tileMap.startX
                this.tileMap.startX ++
    
                if(this.detectColissions())
                    this.tileMap.startX = oldPosition
    
                if(!this.character.moveInterval)
                    this.character.onMovingLeft()
            }
        }

        /* Collision listener */
        detectColissions(){

            for(let i = 0; i < this.colissionMatrix.length; i++){
                for(let j = 0; j < this.colissionMatrix[0].length; j++){
                    if(this.colissionMatrix[i][j] !== 0){
    
                        let relativePosition = this.getTilesRelativePosition(j, i)
                        let playerRelativePosition = this.getPlayerRelativePosition()
    
                        /* Check if exists a colission => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
                        if((playerRelativePosition.posX + (this.tile.width/4) < relativePosition.posX + this.tile.width && playerRelativePosition.posX + (this.tile.width/4) + this.tile.width/2 > relativePosition.posX) 
                            && (playerRelativePosition.posY + (this.tile.width/8) < relativePosition.posY + this.tile.height && playerRelativePosition.posY + this.tile.height > relativePosition.posY)){
                            return true
                        }
                    }
                }
            }
            return false
        }
    }