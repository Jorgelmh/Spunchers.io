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
    constructor(canvas, character, emitPosition ,internalFillColor, internalStrokeColor){

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

        /* Color and Design */
        this.internalFillColor = internalFillColor || "#00AA00"
        this.internalStrokeColor = internalStrokeColor || "#003300"

        /* Character sprite */
        this.character = character

        /* State of the movement */
        this.movement = {x: 0, y: 0}

        /* Callbacks */
        this.emitPosition = emitPosition

         /* Cartesian Value of movement */
         this.cartesianValueOfMovement = {
            x: 0,
            y: 0,
            shoot: false
        }

        /* Touch index */
        this.touchIndexJoystick = 0
        this.touchIndexFireButton = 0

        this.addListeners()
    }

    drawJoystick(){

        /* Draw outer circle */
        this.context.beginPath()
        this.context.arc(this.outterCircle.x, this.outterCircle.y, this.outterCircle.radius, 0, Math.PI * 2)
        this.context.stroke()

        /* Draw inner circle */
        this.context.beginPath()
        this.context.arc(this.innerCircle.x, this.innerCircle.y, this.innerCircle.radius, 0, Math.PI * 2)

        /* Creating a gradient */
        let grd = this.context.createRadialGradient(this.innerCircle.x, this.innerCircle.y, 5, this.innerCircle.x, this.innerCircle.y, 200)
        grd.addColorStop(0, this.internalFillColor)
        grd.addColorStop(1, this.internalStrokeColor)

        /* Filling the circle */
        this.context.fillStyle = grd;
        this.context.fill()
        this.context.stroke()
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
    }

    /** 
     * ===============================
     *      LISTENERS' CALLBACKS
     * ===============================
     * */ 

    handleStart = (e) => {
        /* Determine if user is clicking the inner circle -> implemented using pythagoras */
        e.preventDefault()
        let pos = (window.mobileCheck()) ? e.touches[this.touchIndexJoystick] : e

        if(Math.pow(pos.pageX - this.innerCircle.x, 2) + Math.pow(pos.pageY - this.innerCircle.y, 2) <= Math.pow(this.innerCircle.radius, 2)){
            this.dragging = true
            this.touchIndexFireButton ++

        }

    }

    /* When clicked then starts draggin */
    handleMovement = (e) => {
        e.preventDefault()
        /* if clicked */
        if(this.dragging){
            let source = (window.mobileCheck()) ? e.touches[0] : e
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
        /* When released click then return to original position */
        this.dragging = false
        this.innerCircle.x = this.position.x
        this.innerCircle.y = this.position.y
        this.movement = {x: 0, y: 0}

        /* Stop animation */

        if(this.character.moveInterval)
            this.character.onMovingStop()

        /* Reset cartesian value */
        this.cartesianValueOfMovement = {x: 0, y: 0}

        this.emitPosition(this.movement)
    }
}