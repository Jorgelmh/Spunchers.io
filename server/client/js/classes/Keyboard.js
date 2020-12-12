/**
 *  ===============================
 *      Keyboard Controls Class
 *  ===============================
 */

export default class Keyboard {
    constructor(character, emitPosition, emitBullet, emitReload){
        /* Character -> in order to determine animations */
        this.character = character

        /* Controls */
        this.controls = {
            goUp: false,
            goDown: false,
            goRight: false,
            goLeft: false,
        }

        this.shoot = false

        /* Cartesian Value of movement */
        this.cartesianValueOfMovement = {
            x: 0,
            y: 0
        }

        /* Callbacks */
        this.emitPosition = emitPosition
        this.emitBullet = emitBullet
        this.emitReload = emitReload

        this.addListeners()
    }
    
    /* Add keyboard listeners */
    addListeners(){
        window.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()){
                case 'arrowup':
                    this.controls.goUp = true
                    this.cartesianValueOfMovement.y = (this.controls.goDown) ? 0 : 1
                    break

                case 'arrowdown':
                    this.controls.goDown = true
                    this.cartesianValueOfMovement.y = (this.controls.goUp) ? 0 : -1
                    break

                case 'arrowleft':
                    this.controls.goLeft = true
                    this.cartesianValueOfMovement.x = (this.controls.goRight) ? 0 : -1
                    break

                case 'arrowright':
                    this.controls.goRight = true
                    this.cartesianValueOfMovement.x = (this.controls.goLeft) ? 0 : 1
                    break

                case 'a':
                    this.shoot = true                    
                    break
                case 'r':
                    this.emitReload()
                    break
            }
        })

        window.addEventListener('keyup', (e) => {

            switch (e.key.toLowerCase()){
                case 'arrowup':
                    this.character.onMovingStop()
                    this.controls.goUp = false
                    this.cartesianValueOfMovement.y = (this.controls.goDown) ? -1 : 0
                    break

                case 'arrowdown':
                    this.character.onMovingStop()
                    this.controls.goDown = false
                    this.cartesianValueOfMovement.y = (this.controls.goUp) ? 1 : 0
                    break

                case 'arrowleft':
                    this.character.onMovingStop()
                    this.controls.goLeft = false
                    this.cartesianValueOfMovement.x = (this.controls.goRight) ? 1 : 0
                    break

                case 'arrowright':
                    this.character.onMovingStop()
                    this.controls.goRight = false
                    this.cartesianValueOfMovement.x = (this.controls.goLeft) ? -1 : 0
                    break
                case 'a':
                    this.shoot = false
                    this.character.spriteSheet.img = this.character.spriteImages.normal
                    break

            }
            this.emitPosition({x: 0, y: 0})
        })
    }
    /**
     * ==========================
     *      Animate Character
     * ==========================
     */

     /* Animating local character using data from server */
    animate(){
        
        let movement = {x: 0, y: 0}

        if(this.controls.goUp && this.controls.goLeft){
            movement.x = - Math.sin(Math.PI / 4)
            movement.y = - Math.sin(Math.PI / 4)
            if(this.character.currentSprite.y != 3){
                this.character.onMovingStop()
                this.character.onMovingForwardLeft()
            } 
        }

        if(this.controls.goUp && this.controls.goRight){
            movement.x = Math.sin(Math.PI / 4)
            movement.y = - Math.sin(Math.PI / 4)
            if(this.character.currentSprite.y != 3){
                this.character.onMovingStop()
                this.character.onMovingForwardRight()
            } 
        }

        if(this.controls.goDown && this.controls.goRight){
            movement.x = Math.sin(Math.PI / 4)
            movement.y = Math.sin(Math.PI / 4)
            if(this.character.currentSprite.y != 4){
                this.character.onMovingStop()
                this.character.onMovingBackwardsRight()
            } 
        }

        if(this.controls.goDown && this.controls.goLeft){
            movement.x = -Math.sin(Math.PI / 4)
            movement.y = Math.sin(Math.PI / 4)

            if(this.character.currentSprite.y != 4){
                this.character.onMovingStop()
                this.character.onMovingBackwardsLeft()
            } 
        }

        if(this.controls.goUp){
            movement.y = (this.controls.goDown) ? 0 : -1

            if(!this.character.moveInterval)
                this.character.onMovingForward()
        }
        

        if(this.controls.goDown){
            movement.y = (this.controls.goUp) ? 0 : 1

            if(!this.character.moveInterval)
                this.character.onMovingBackwards()
        }

        if(this.controls.goRight){
            movement.x = (this.controls.goLeft) ? 0 : 1

            if(!this.character.moveInterval)
                this.character.onMovingRight()
        }
        
        if(this.controls.goLeft){

            movement.x = (this.controls.goRight) ? 0 : -1

            if(!this.character.moveInterval)
                this.character.onMovingLeft()
        }

        this.emitPosition(movement)
    }
}