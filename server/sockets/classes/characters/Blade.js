/* Import super class */
const Character = require('./Character.js')

class Blade extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'blade'
        this.shootingDelay = 200
        this.impactDamage = 25
    }

    /* offsetYHorizontal when player is in horizontal movement => y:1 and y:2 */
    offsetYHorizontal(halfTileWidth){
        return halfTileWidth + (halfTileWidth/6)
    }

    /* diagonalUpOffset when player is going diagonal up */
    diagonalUpOffsetX(halfTileWidth, dirX){
        return (halfTileWidth * dirX)
    }

    diagonalUpOffsetY(halfTileWidth, dirY){
        return (halfTileWidth * -dirY)
    }

    /* diagonalUpOffset when player is going diagonal down */
    diagonalDownOffsetX(halfTileWidth, dirX){
        return (halfTileWidth * dirX)
    }
    diagonalDownOffsetY(halfTileWidth, dirY){
        return (halfTileWidth + halfTileWidth * dirY)
    }
}

module.exports = Blade