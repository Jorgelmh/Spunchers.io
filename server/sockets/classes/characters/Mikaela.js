/* Import super class */
const Character = require('./Character.js')

class Mikaela extends Character{
    constructor(posX, posY, sprite, playerName){
        super(posX, posY, sprite, playerName)

        /* Specific data about this character */
        this.skin = 'mikaela'
        this.shootingDelay = 400
        this.impactDamage = 65

        /* Full charger bullets */
        this.ammunition = 2

        /* Current state of the charger */
        this.bulletsCharger = this.ammunition

        this.reloadTime = 1000

    }

    /* Create a set of bullets shotgun style */
    createBullet(playerID, position, bullet){

        let angle = Math.atan2(bullet.dir.y, bullet.dir.x)

        /* extra bullets from shotgun gunshot */
        let bullet2 = angle+Math.PI/8
        let bullet3 = angle-Math.PI/8

        return [
            {
                ownerID: playerID,
                posX: position.x,
                posY: position.y,
                dirX: bullet.dir.x,
                dirY: bullet.dir.y,
                flip: this.character.currentSprite.flip,
                spriteY: bullet.spriteY
            },
            {
                ownerID: playerID,
                posX: position.x,
                posY: position.y,
                dirX: Math.cos(bullet2),
                dirY: Math.sin(bullet2),
                flip: this.character.currentSprite.flip,
                spriteY: bullet.spriteY
            },
            {
                ownerID: playerID,
                posX: position.x,
                posY: position.y,
                dirX: Math.cos(bullet3),
                dirY: Math.sin(bullet3),
                flip: this.character.currentSprite.flip,
                spriteY: bullet.spriteY
            }
            
        ]
        
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

module.exports = Mikaela