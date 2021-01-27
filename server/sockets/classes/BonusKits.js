/**
 *  ===========================
 *      BONUS KITS RESPAWNER
 *  ===========================
 */

class BonusKits {
    constructor(tile, collisionMatrix){

        /* Collision matrix to check whether the bonnus will be spawned on to an object */
        this.collisionMatrix = collisionMatrix

        /* Tile dimension */
        this.tile = tile

        /* Dimensions of the bonus kits */
        this.width = tile.width / 2
        this.height = tile.height / 2

        /* Current state of each bonus */
        this.medicalKit = {
            lastPicked: Date.now(),
            respawningTime: 2000
        }

        this.bulletKit = {
            lastPicked: Date.now(),
            respawningTime: 2000
        }

        /* not respawnable positions around the map */
        this.notRespawnable = 9
    }

    /* respawn a bullet kit around the map */
    respawnBulletKit(){
        this.bulletKit.position = this.getRespawnPosition(this.medicalKit.position, 'bullet')
    }

    /* respawn a medical kit around the map */
    respawnMedicalKit(){
        this.medicalKit.position = this.getRespawnPosition(this.bulletKit.position, 'medical')
    }

    /* Get a random position suitable for respawning either bonus */
    getRespawnPosition(otherBonusPos, name){
        let tileX, tileY, x, y
        let repeatedPos

        do{
            /* respawn a tile position which is within the area players can move -> avoid surrounding areas of the map */
            tileX = Math.floor(Math.random() * ((this.collisionMatrix[0].length - this.notRespawnable) - this.notRespawnable) + this.notRespawnable)
            tileY = Math.floor(Math.random() * ((this.collisionMatrix.length - this.notRespawnable) - this.notRespawnable) + this.notRespawnable) 

            /* Calculate actual position to check it's not the sames as the other bonus */
            x = (tileX * this.tile.width) + (this.tile.width - this.width)/2,
            y = (tileY * this.tile.height) + (this.tile.height - this.height)/2

            repeatedPos = (otherBonusPos) ? (otherBonusPos.x === x && otherBonusPos.y === y) : false

        }while(this.collisionMatrix[tileY][tileX] !== 0 && !repeatedPos)

        console.log(x,y);

        return {
            x,
            y
        }

    }
}

module.exports = BonusKits