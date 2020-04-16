/* 
    ========================
        Character Object
    ========================
*/

const character = {

    /* Sprites */
    currentSprite: {
        x: null,
        y: null
    },
    spriteSheet: {
        img: null,
        width: 32,
        height: 48
    },

    /* Animations */
    animationSpeed: 250,
    staticInterval: undefined,
    moveInterval: undefined,

    /* Matrix position */

    posY: null,
    posX: null,

    /* Load the sprites for the given character */
    load: function(name, callback) {

        this.spriteSheet.img = new Image()
        this.spriteSheet.img.onload = () =>{
            this.currentSprite.x = 0
            this.currentSprite.y = 3
            callback()
        }
        this.spriteSheet.img.src = `../characters/${name}`
    },

    /* Change the image when moving forward */
    onMovingForward: function() {
        this.currentSprite.y = 3

        this.moveInterval = setInterval(() =>{
            this.currentSprite.x ++

            if(this.currentSprite.x > 3) 
                this.currentSprite.x = 0

        }, this.animationSpeed)
    },

    onMovingBackwards: function(){
        this.currentSprite.y = 0

        this.moveInterval = setInterval(() =>{
            this.currentSprite.x ++

            if(this.currentSprite.x > 3) 
                this.currentSprite.x = 0
        }, this.animationSpeed)
    },

    onMovingLeft: function(){
        this.currentSprite.y = 1

        this.moveInterval = setInterval(() =>{
            this.currentSprite.x ++

            if(this.currentSprite.x > 3) 
                this.currentSprite.x = 0
        }, this.animationSpeed)
    },

    onMovingRight: function(){
        this.currentSprite.y = 2

        this.moveInterval = setInterval(() =>{
            this.currentSprite.x ++

            if(this.currentSprite.x > 3) 
                this.currentSprite.x = 0

        }, this.animationSpeed)
    },

    /* Delete  */
    onMovingStop: function(){
        clearInterval(this.moveInterval)
        this.currentSprite.x = 0
        this.moveInterval = null
    }

    
}

export default character