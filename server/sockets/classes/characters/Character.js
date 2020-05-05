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
}

module.exports = Character