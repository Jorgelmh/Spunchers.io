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

        /* Show scores */
        this.showScores = false

        /* Emit position 30 times per second */
        this.emit = true

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
                case'tab':
                    e.preventDefault()
                    this.showScores = true
                    break
                case 'r':
                    this.emitReload()
                    break
                    
            }
        })

        window.addEventListener('keyup', (e) => {

            switch (e.key.toLowerCase()){
                case 'arrowup':
                    this.character.stopMoving()
                    this.controls.goUp = false
                    this.cartesianValueOfMovement.y = (this.controls.goDown) ? -1 : 0
                    break

                case 'arrowdown':
                    this.character.stopMoving()
                    this.controls.goDown = false
                    this.cartesianValueOfMovement.y = (this.controls.goUp) ? 1 : 0
                    break

                case 'arrowleft':
                    this.character.stopMoving()
                    this.controls.goLeft = false
                    this.cartesianValueOfMovement.x = (this.controls.goRight) ? 1 : 0
                    break

                case 'arrowright':
                    this.character.stopMoving()
                    this.controls.goRight = false
                    this.cartesianValueOfMovement.x = (this.controls.goLeft) ? -1 : 0
                    break
                case 'a':
                    this.shoot = false
                    break
                case 'tab':
                    e.preventDefault()
                    this.showScores = false
                    document.getElementById('site-individual-scores').style.display = 'none'
                    break
            }
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
            if(this.character.currentSprite.y != 3){
                this.character.stopMoving()
                this.character.onMovingForwardLeft()
            } 
        }

        if(this.controls.goUp && this.controls.goRight){
            if(this.character.currentSprite.y != 3){
                this.character.stopMoving()
                this.character.onMovingForwardRight()
            } 
        }

        if(this.controls.goDown && this.controls.goRight){
            if(this.character.currentSprite.y != 4){
                this.character.stopMoving()
                this.character.onMovingBackwardsRight()
            } 
        }

        if(this.controls.goDown && this.controls.goLeft){
            if(this.character.currentSprite.y != 4){
                this.character.stopMoving()
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

        if(this.shoot)
            this.createBullet()

        if(this.emit){
            if(movement.x !== 0 || movement.y !== 0){
                this.emitPosition(movement)
                this.emit = false
            }
            else if(this.character.currentSprite.y !== 5){
                this.character.onMovingStop()
                this.emitPosition(movement)
            }
        }else
            this.emit = true
    }

    createBullet(){

        /* Position on bullet sprite (Y) */
        let spriteY = 0

        /* Direction of bullet */
        let dir = {
            x: 0,
            y: 0
        }

        switch (this.character.currentSprite.y){
            case 0:
                dir.x = 0
                dir.y = 1 
                spriteY = 0
                break
            case 1:
                dir.y = 0
                dir.x = 1 * this.character.currentSprite.flip
                spriteY = 2
                break
            case 2:
                dir.x = 0
                dir.y = -1
                spriteY = 0
                break
            case 3:
                dir.y = -Math.sin(Math.PI / 4)
                dir.x = Math.sin(Math.PI / 4) * this.character.currentSprite.flip
                spriteY = 1
                break
            case 4:
                dir.y = Math.sin(Math.PI / 4)
                dir.x = Math.sin(Math.PI / 4) * this.character.currentSprite.flip
                spriteY = 3
                break
            case 5: 
                dir.x = 1 * this.character.currentSprite.flip
                dir.y = 0
                spriteY = 2
                break
        }
        this.emitBullet(dir, spriteY)
    }
}