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

        /* Timing */
        this.lastDeath = Date.now()
        this.ableToShoot = true
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
        return {
            posX: this.posX,
            posY: this.posY,
            character: this.character,
            life: this.life,
            shooting: this.shooting,
            skin: this.skin,
            playerName: this.playerName,
            ableToShoot: this.ableToShoot,
            currentAmmo: this.bulletsCharger
        }
    }
}

module.exports = Character