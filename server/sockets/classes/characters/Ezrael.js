/* Import super class */
const Character = require('./Character')

class Ezrael extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'ezrael'
        this.shootingDelay = 350
        this.impactDamage = 100

        /* Full charger bullets */
        this.ammunition = 1

        /* Current state of the charger */
        this.bulletsCharger = this.ammunition

        this.reloadTime = 1200

        /* Gunshot sound effect */
        this.gunshotSound = 'sniper'

    }

    /* offsetYHorizontal when player is in horizontal movement => y:1 and y:2 */
    offsetYHorizontal(halfTileWidth){
        return halfTileWidth + (halfTileWidth/3)
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

module.exports = Ezrael