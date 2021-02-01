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

        /* reloading */
        this.reloading = false
        this.lastReload = 0

        /* Increase life when player is out of combat */
        this.lastHit = 0

        /* LAST PACKET TIMESTAMP */
        this.lastPacketTimeStamp = 0

        /* Kills count */
        this.kills = 0

        /* Deaths count */
        this.deaths = 0
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
                spriteY: bullet.spriteY,
                timeStamp: Date.now()
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
            reloading: this.reloading,
            timeStamp: this.lastPacketTimeStamp,
            kills: this.kills,
            deaths: this.deaths
        }
    }
}

module.exports = Character