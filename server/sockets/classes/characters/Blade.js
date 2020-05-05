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
}

module.exports = Blade