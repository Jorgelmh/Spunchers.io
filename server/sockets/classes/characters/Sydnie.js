/* Import super class */
const Character = require('./Character.js')

class Sydnie extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'sydnie'
        this.shootingDelay = 90
        this.impactDamage = 20

        /* Full charger bullets */
        this.ammunition = 60

        /* Current state of the charger */
        this.bulletsCharger = this.ammunition

        this.reloadTime = 3000

        /* Gunshot sound effect */
        this.gunshotSound = 'silencer'
    }

    /* offsetYHorizontal when player is in horizontal movement => y:1 and y:2 */
    offsetYHorizontal(halfTileWidth){
        return halfTileWidth + (halfTileWidth/4)
    }

    /* diagonalUpOffset when player is going diagonal up */
    diagonalUpOffsetX(halfTileWidth, dirX){
        return (halfTileWidth/2 * dirX)
    }

    diagonalUpOffsetY(halfTileWidth){
        return halfTileWidth - (halfTileWidth/4)
    }

    /* diagonalUpOffset when player is going diagonal down */
    diagonalDownOffsetX(halfTileWidth, dirX){
        return (halfTileWidth/6 * dirX)
    }
    diagonalDownOffsetY(halfTileWidth){
        return halfTileWidth + (halfTileWidth/4)
    }
}

module.exports = Sydnie