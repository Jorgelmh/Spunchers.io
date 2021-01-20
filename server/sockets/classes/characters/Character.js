/**
 * ==============================
 *     CHARACTERS SUPER-CLASS
 * ==============================
 */

class Character {
    constructor(posX, posY, sprite, playerName){

        this.playerName = playerName
        
        /* Position and state of the character */
        this.posX = posX
        this.posY = posY

        this.character = {
            currentSprite: sprite
        }

        this.score = 0
        this.life = 100
        this.shooting = null

        this.cartesianValueOfMovement = {
            x: 0,
            y: 0
        }

        /* Timing */
        this.lastDeath = Date.now()
        this.ableToShoot = true

        this.still = true
        this.lastShot = Date.now()

        this.lastUpdate = 0

        /* Interpolation */
        this.buffer = []

        /* reloading */
        this.reloading = false
        this.lastReload = 0
    }
    
    /* dequeue interpolated state */
    dequeueState(){
        let state = this.buffer[0]
        this.buffer.splice(0,1)

        this.lastUpdate = Date.now()

        return state
    }

    /* Standard method for creating bullets -> it returns only one bullet based on the movement of the player*/
    createBullet(playerID, position,bullet){
        return [{
                ownerID: playerID,
                posX: position.x,
                posY: position.y,
                dirX: bullet.dir.x,
                dirY: bullet.dir.y,
                flip: this.character.currentSprite.flip,
                spriteY: bullet.spriteY
        }]
    }

    reduceAmmunition(){
        this.bulletsCharger --

        if(this.bulletsCharger === 0){
            this.reloading = true
            this.lastReload = Date.now()
        }        
    }

    /* Return what the client needs in order to draw the player */
    playerState(){

        return {
            posX: this.posX,
            posY: this.posY,
            character: this.character,
            life: this.life,
            shooting: this.shooting,
            skin: this.skin,
            playerName: this.playerName,
            ableToShoot: this.ableToShoot,
            currentAmmo: this.bulletsCharger,
            cartesianValueOfMovement: this.cartesianValueOfMovement,
            still:  this.still,
            reloading: this.reloading
        }
    }
}

module.exports = Character