/* 
    ========================
        Character Object
    ========================
*/

const character = {


    deathCharacter : false,

    /* Sprites */
    currentSprite: {
        x: 0,
        y: 5,
        flip: 1
    },
    spriteSheet: {
        img: null,
        width: 64,
        height: 64
    },

    /* Animations */
    animationSpeed: 250,
    moveInterval: undefined,

    /* Matrix position */

    posY: null,
    posX: null,

    /* Load the sprites for the given character */
    load: function(name, callback) {

        /* Load sprite for character */
        let sprite = new Image()
        sprite.onload = () =>{
            this.spriteSheet.img = sprite
            callback()
        }
        sprite.src = `../assets/characters/${name}`

    },

    /* Change the image when moving forward */
    onMovingForward: function() {
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 2

        this.createInterval()
    },

    onMovingBackwards: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 0

        this.createInterval()
    },

    onMovingLeft: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 1
        this.currentSprite.flip = -1

        this.createInterval()
    },

    onMovingRight: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 1
        this.currentSprite.flip = 1

        this.createInterval()
    },

    onMovingForwardLeft: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 3
        this.currentSprite.flip = -1

        this.createInterval()
    },

    onMovingForwardRight: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 3
        this.currentSprite.flip = 1

        this.createInterval()
    },

    onMovingBackwardsRight: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 4
        this.currentSprite.flip = 1

        this.createInterval()
    },

    onMovingBackwardsLeft: function(){
        if(this.currentSprite.y === 0)
            this.currentSprite.x = 0
        this.currentSprite.y = 4
        this.currentSprite.flip = -1

        this.createInterval()
    },
    
    createInterval : function(){
        this.moveInterval = setInterval(() =>{
            this.currentSprite.x ++
            if(this.currentSprite.x > 3) 
                this.currentSprite.x = 0

        }, this.animationSpeed)  
    },

    /* Delete  */
    onMovingStop: function(){
        this.currentSprite.y = 5
    },

    stopMoving: function(){
        clearInterval(this.moveInterval)
        this.moveInterval = null
    }

    
}

export default character