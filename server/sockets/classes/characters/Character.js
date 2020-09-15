/**
 * ==============================
 *     CHARACTERS SUPER-CLASS
 * ==============================
 */

class Character {
    constructor(posX, posY, sprite, playerName){

        this.playerName = playerName
        this.controls = {
            goUp: false,
            goDown: false,
            goRight: false,
            goLeft: false
        }
        
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

        /* Flip Image */
        this.flipImage = 1
        this.orientationWhenQuite = 1
    }

    reduceAmmunition(emitReload, playerID){
        this.bulletsCharger --

        if(this.bulletsCharger === 0)
            this.reloadWeapon(emitReload, playerID)
        
    }

    reloadWeapon(emitReload, playerID){
        setTimeout(() => {
            this.bulletsCharger = this.ammunition
            emitReload(playerID)
        }, this.reloadTime)
    }

    /* Return what the client needs in order to draw the player */
    playerState(){
        let still = false

        if(this.controls)
            still = Object.keys(this.controls).every((k) => { return !this.controls[k] });

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
            still
        }
    }
}

module.exports = Character