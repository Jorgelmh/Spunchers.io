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
}

module.exports = Mikaela