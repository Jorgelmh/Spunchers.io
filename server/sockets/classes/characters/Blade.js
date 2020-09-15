/* Import super class */
const Character = require('./Character.js')

class Blade extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'blade'
        this.shootingDelay = 200
        this.impactDamage = 25

        /* Full charger bullets */
        this.ammunition = 30

        /* Current state of the charger */
        this.bulletsCharger = 30

        this.reloadTime = 1200
    }

    /* offsetYHorizontal when player is in horizontal movement => y:1 and y:2 */
    offsetYHorizontal(halfTileWidth){
        return halfTileWidth + (halfTileWidth/6)
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

module.exports = Blade