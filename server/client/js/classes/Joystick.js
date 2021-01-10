/**
 * ===============================
 *        Joystick Class
 * ===============================
 * 
 * @constructor
 * 
 * @param canvas {Object} - HTML canvas element where the joystick will be drawn
 * @param position {Object} - X and Y positions to draw the joystick
 * @param radius {Integer} - Radius of the outter circle -> inner will be drawn based on this value (60% of outter)
 * @param internalFillColor {String} (optional) - Internal color of inner circle
 * @param internalStrokeColor {String} (optional) - Border color of inner circle
 * 
 */

export default class Joystick{
    constructor(canvas, character, emitPosition, emitBullet ,internalFillColor, internalStrokeColor){

        /* Drawing canvas */
        this.canvas = canvas
        this.context = canvas.getContext("2d")

        /* Cos and sin */
        this.movement = {
            cos: 0,
            sin: 0
        }

        this.angleInDegrees = 0

        /* Dragging */
        this.dragging = false
        this.shoot = false

        /* Color and Design */
        this.internalFillColor = internalFillColor || "rgba(255,255,255,0.8)"

        /* Character sprite */
        this.character = character

        /* State of the movement */
        this.movement = {x: 0, y: 0}

        /* Callbacks */
        this.emitPosition = emitPosition
        this.emitBullet = emitBullet

         /* Cartesian Value of movement */
         this.cartesianValueOfMovement = {
            x: 0,
            y: 0,
            shoot: false
        }

        /* Bullet direction */
        this.bulletDir = {
            x: 0,
            y: 0
        }

        /* Manage indexes of touch events */
        this.indexJoystick = 0
        this.indexShootButton = 0

        /* Keep track of fingers touching the screen */
        this.touchingFingers = []

        this.addListeners()
    }

    drawJoystick(){

        this.context.lineWidth = 2

        /* Filling style */
        this.context.fillStyle = this.internalFillColor

        /* Draw outer circle */
        this.context.beginPath()
        this.context.arc(this.outterCircle.x, this.outterCircle.y, this.outterCircle.radius, 0, Math.PI * 2)
        this.context.stroke()

        /* Draw inner circle */
        this.context.beginPath()
        this.context.arc(this.innerCircle.x, this.innerCircle.y, this.innerCircle.radius, 0, Math.PI * 2)
        this.context.fill()
        this.context.stroke()

        /* Draw shooting circle */
        this.context.beginPath()
        this.context.arc(this.shootButton.x, this.shootButton.y, this.shootButton.radius, 0, Math.PI * 2)
        this.context.fill()
        this.context.stroke()

        /* Draw text under shoot circle */
        this.context.textAlign = 'center'
        this.context.strokeText('Shoot', this.shootButton.x, this.shootButton.y + 3)

    }

    /* Event listener to detect if the user is dragging */
    addListeners(){

        window.addEventListener('resize', this.resize)

        this.resize()

        if(window.mobileCheck()){
            this.canvas.addEventListener('touchstart', this.handleStart)
            this.canvas.addEventListener('touchmove', this.handleMovement)
            this.canvas.addEventListener('touchend', this.handleReleased)
        }else{
            this.canvas.addEventListener('mousedown', this.handleStart)
            this.canvas.addEventListener('mouseup', this.handleReleased)
            this.canvas.addEventListener('mousemove', this.handleMovement)
        }  
    }

    /* Resize joystick -> Responsive */

    resize = () => {
        /* radius of outter circle */
        this.radius = this.canvas.width * .07

        /* Stablishing dimensions */
        this.position = {
            x: this.radius + this.canvas.width * .07,
            y: this.canvas.height - (this.radius + this.canvas.height * 0.1)
        }

        /* Outer circle */
        this.outterCircle = {
            x: this.position.x,
            y: this.position.y,
            radius: this.radius
        }

        /* Inner circle */
        this.innerCircle = {
            x: this.position.x,
            y: this.position.y,
            radius: this.radius * .60
        }

        /* Shoot button */
        this.shootButton = {
            x: this.canvas.width - this.radius - this.canvas.width * .07,
            y: this.position.y,
            radius: this.radius * .6
        }
        
        this.drawJoystick()

    }

    /**
     *  @desc Compute value of character movement based on position of inner circle
     * 
     *  @param x - inner circle's X position with regards to outter circle => innerCircleX - outterCircleX
     *  @param y - inner circle's Y position with regards to outter circle => OutterCircleY - innerCircleY
     * 
     *  Note: As Y axis is inverted on a canvas, then we must substract from outterCircle
     * 
     *  @returns - Object with the value of movement on X and Y
     * */ 
    computeAngles(x, y, angle){

        let movement = {x: 0, y: 0}

        /* Calculate the proportion of the distance to be moved */
        let hypotenuse = Math.sqrt(Math.pow(this.outterCircle.x - this.innerCircle.x, 2) + Math.pow(this.innerCircle.y - this.outterCircle.y, 2))

        /* Get porcentage of movement regards to inner circle's radius */
        let proportionOfMovement = hypotenuse * 100 / this.outterCircle.radius

        let degreeAngle = angle * 180 / Math.PI

        if( x >= 0 ){
            if(y >= 0){
                movement = {x: Math.cos(angle), y: Math.sin(angle)}
                degreeAngle = -degreeAngle
            }
            else{
                movement = {x: Math.cos(angle), y: Math.sin(angle)}
                degreeAngle = 360 - degreeAngle
            }
        }else{
            if(y >= 0){
                movement = {x: -Math.cos(angle), y: -Math.sin(angle)}
                degreeAngle = 180 - degreeAngle
            }
            else{
                movement = {x: -Math.cos(angle), y: -Math.sin(angle)}
                degreeAngle -= 180
                degreeAngle = -degreeAngle
            }
        }

        /* Set bullet direction for future shooting */
        this.bulletDir = {
            x: movement.x,
            y: movement.y
        }


        /* apply proportion of movement */
        movement.x *= proportionOfMovement/100
        movement.y *= proportionOfMovement/100

        /* TESTING */
        //console.log(`${movement.x}, ${movement.y}`);

        this.movement.x = movement.x
        this.movement.y = movement.y 

        this.cartesianValueOfMovement.x = this.movement.x
        this.cartesianValueOfMovement.y = -this.movement.y

        this.angleInDegrees = degreeAngle
    }

    /* Animate -> emitPosition */

    animate(){
        if(this.movement.x || this.movement.y){

            //Calculate character animation
            
            let angle = 22.5

            if((this.angleInDegrees <= angle || this.angleInDegrees > 337.5) && this.character.currentSprite.y != 1){
                this.character.onMovingStop()
                this.character.onMovingRight()
            }

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 3){
                this.character.onMovingStop()
                this.character.onMovingForwardRight()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 2){
                this.character.onMovingStop()
                this.character.onMovingForward()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 3){
                this.character.onMovingStop()
                this.character.onMovingForwardLeft()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 1){
                this.character.onMovingStop()
                this.character.onMovingLeft()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 4){
                this.character.onMovingStop()
                this.character.onMovingBackwardsLeft()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 0){
                this.character.onMovingStop()
                this.character.onMovingBackwards()
            }

            //Next animation if doesn't match
            angle += 45

            if(this.angleInDegrees > angle && this.angleInDegrees <= angle + 45 && this.character.currentSprite.y != 4){
                this.character.onMovingStop()
                this.character.onMovingBackwardsRight()
            }

            this.emitPosition(this.movement)
        }

        if(this.shoot)
            this.createBullet()
    }

    /* Create bullet trayectory and sprite of the animation */
    createBullet(){

        /* Direction of bullet's trayectory */
        let dir = {
            x: 0,
            y: 0
        }

        let spriteY = 0

        /* Set trayectory */
        if(this.character.currentSprite.y === 5)
            dir.x = 1 * this.character.currentSprite.flip

        else
            dir = this.bulletDir

        /* Set bullet's sprite position in Y axis */
        if(this.character.currentSprite.y === 1 || this.character.currentSprite.y === 5)
            spriteY = 2

        if(this.character.currentSprite.y === 3)
            spriteY = 1
        
        if(this.character.currentSprite.y === 4)
            spriteY = 3


        this.emitBullet(dir, spriteY)

    }

    /** 
     * ===============================
     *      LISTENERS' CALLBACKS
     * ===============================
     * */ 

    handleStart = (e) => {
        /* Determine if user is clicking the inner circle -> implemented using pythagoras */
        e.preventDefault()

        /* Push the new finger onto the buffer */
        this.touchingFingers.push(e.changedTouches[0].identifier)
        let posJoystick = this.touchingFingers[this.indexJoystick]

        /* If touching the joystick */
        if( !isNaN(posJoystick) && Math.pow(e.changedTouches[0].pageX - this.innerCircle.x, 2) + Math.pow(e.changedTouches[0].pageY - this.innerCircle.y, 2) <= Math.pow(this.innerCircle.radius, 2)){
            this.dragging = true

            /* Set index on touch event's array */
            if(!this.shoot){
                this.indexJoystick = 0
                this.indexShootButton = 1
            }

        }

        let posShootButton = this.touchingFingers[this.indexShootButton]

        /* If touching the shoot button */
        if( !isNaN(posShootButton) && Math.pow(e.changedTouches[0].pageX - this.shootButton.x, 2) + Math.pow(e.changedTouches[0].pageY - this.shootButton.y, 2) <= Math.pow(this.shootButton.radius, 2)){
            this.shoot = true 

            /* Set index on touch event's array */
            if(!this.dragging){
                this.indexShootButton = 0
                this.indexJoystick = 1
            }
        }
    }

    /* When clicked then starts dragging */
    handleMovement = (e) => {
        e.preventDefault()
        /* if clicked */
        if(this.dragging){
            let source = (window.mobileCheck()) ? e.touches[this.indexJoystick] : e
            let mx = source.pageX
            let my = source.pageY

            let angle = Math.atan((my - this.outterCircle.y)/(mx - this.outterCircle.x))

            /* Move freely while in the outer circle */
            if(Math.pow(mx - this.outterCircle.x, 2) + Math.pow(my - this.outterCircle.y, 2) <= Math.pow(this.outterCircle.radius, 2)){
                this.innerCircle.x = mx
                this.innerCircle.y = my
            } else {

                /* When the cursor is outside outer function then predict the position of inner circle
                    using sin and cos */

                let offsetX
                let offsetY

                if(mx < this.outterCircle.x){
                    offsetX = (this.outterCircle.x - (this.radius * Math.cos(angle))) - mx
                    this.innerCircle.x = mx + offsetX
                }else{
                    offsetX = mx - (this.outterCircle.x + (this.radius * Math.cos(angle)))
                    this.innerCircle.x = mx - offsetX
                }

                if(my < this.outterCircle.y){
                    offsetY = (this.outterCircle.y - (this.radius * Math.sign(angle) *Math.sin(angle))) - my
                    this.innerCircle.y = my + offsetY
                }else{
                    offsetY = my - (this.outterCircle.y + (this.radius * Math.sign(angle) * Math.sin(angle)))
                    this.innerCircle.y = my - offsetY
                }

            }
            /* Compute the values of movement for characters */
           this.computeAngles(mx - this.outterCircle.x, this.outterCircle.y - my, angle)

        }
    }

    handleReleased = (e) => {
        e.preventDefault()

        //console.log(` Joystick: ${this.indexJoystick} AND shootButton: ${this.indexShootButton}`);

        if(this.touchingFingers[this.indexJoystick] === e.changedTouches[0].identifier){

            this.dragging = false
            this.touchingFingers.splice(this.indexJoystick, 1)
                
            /* When released click then return to original position */
            this.innerCircle.x = this.position.x
            this.innerCircle.y = this.position.y
            this.movement = {x: 0, y: 0}

            /* Stop animation */

            if(this.character.moveInterval)
                this.character.onMovingStop()

            /* Reset cartesian value */
            this.cartesianValueOfMovement = {x: 0, y: 0}

            /* Only swap indexes when the one released is smaller */
            if(this.indexJoystick < this.indexShootButton){
                let temp = this.indexJoystick
                this.indexJoystick = this.indexShootButton
                this.indexShootButton = temp
            }


        }
        if(this.touchingFingers[this.indexShootButton] === e.changedTouches[0].identifier){
            this.touchingFingers.splice(this.indexShootButton, 1)
            this.shoot = false

            /* Only swap indexes when the one released is smaller */
            if(this.indexShootButton < this.indexJoystick){
                let temp = this.indexJoystick
                this.indexJoystick = this.indexShootButton
                this.indexShootButton = temp
            }
        }

        //console.log(`Shooting: ${this.shoot} , Dragging: ${this.dragging}`);

        /* If no finger is touching the screen then both indexes are 0; both will be waiting in the first position */
        if(this.touchingFingers.length == 0){
            this.indexJoystick = 0
            this.indexShootButton = 0
        }

        this.emitPosition(this.movement)
    }
}