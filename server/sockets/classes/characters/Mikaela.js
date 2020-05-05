/* Import super class */
const Character = require('./Character.js')

class Mikaela extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'mikaela'
        this.shootingDelay = 400
        this.impactDamage = 65
    }

    /* offsetYHorizontal when player is in horizontal movement => y:1 and y:2 */
    offsetYHorizontal(halfTileWidth){
        return halfTileWidth + (halfTileWidth/5)
    }

    /* diagonalUpOffset when player is going diagonal up */
    diagonalUpOffsetX(halfTileWidth, dirX){
        return (halfTileWidth * dirX) - (halfTileWidth/5)
    }

    diagonalUpOffsetY(halfTileWidth, dirY){
        return (halfTileWidth * -dirY)
    }

    /* diagonalUpOffset when player is going diagonal down */
    diagonalDownOffsetX(halfTileWidth, dirX){
        return (halfTileWidth * dirX) + (-dirX * halfTileWidth/5)
    }
    diagonalDownOffsetY(halfTileWidth, dirY){
        return (halfTileWidth + halfTileWidth * dirY)
    }
}

module.exports = Mikaela