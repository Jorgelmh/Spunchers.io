import character from './character.js'

const engine = {

    /* General variables */
    canvas : undefined,
    context : undefined,
    tileList: [],
    tileImages: [],

    /* Tile properties */

    tile: {
        width: null,
        height: null
    },

    /*  TileMap Object -> properties and tiles  */

    tileMap: {

        tileSet: undefined,
        tiles: [],
        startX: -100,
        startY: -10,
        width: 1280,
        height: 720
    },

    /* Tiles per screen */

    screenTiles: {
        x: 16,
        y: 9
    },

    frameDefaultDimensions: {
        width: 1280,
        height: 720
    },

    frameRatio: null,

    offSet:{
        x: null,
        y: null,
        xLimit: null,
        yLimit: null
    },

    /* FPS Counter */

    lastFrameTime: 0,
    FPS : 0,

    /* Controls */
    controls: {
        goUp: false,
        goDown: false,
        goRight: false,
        goLeft: false 
    },

    /* Collisionable */
    colission : [],


    /**
     * ======================
     *       Functions
     * ======================
     */

    run : function(){

        this.canvas = document.getElementById('game')
        this.context = this.canvas.getContext("2d")
        window.addEventListener('resize', this.resizeCanvas)

        this.frameRatio = this.frameDefaultDimensions.height / this.frameDefaultDimensions.width

        console.log(this.tileList)
        console.log(this.tileImages)
        console.log(this.colission)

        this.resizeCanvas()
        this.addControls()

        requestAnimationFrame(this.render)
    },

    load: function(mapObject){

        this.tileMap.tileSet = mapObject.tileSet
        this.tileMap.tiles = mapObject.tileMap
        this.colission = mapObject.collisionable

        /* Retrieve single tile values */
        for(let row of mapObject.tileMap){
            for(let element of row){
                if(this.tileList.indexOf(element) < 0)
                    this.tileList.push(element)
            }
        }

        /* Retrieve single tile values for objects */
        for(let row of mapObject.collisionable){
            for(let element of row){
                if(element != 0 && this.tileList.indexOf(element) < 0)
                    this.tileList.push(element)
            }
        }
        
        let loadedImages = 0 // Check if all images have been loaded
        let self = this

        for(let i = 0; i < this.tileList.length; i++){

            let tileImage = new Image()
            tileImage.onload = () => {
                if(++loadedImages >= this.tileList.length)
                    self.loadCharacter()
            }
            tileImage.src = `../tiles/tile_00${(this.tileList[i]<10) ? '0'+this.tileList[i]: this.tileList[i]}.png`

            this.tileImages.push({
                id: this.tileList[i],
                img: tileImage
            })
        }

    },
    
    /* 
        ======================
            Load Character
        ======================
    */

    loadCharacter: function () {
        character.load('stormtrooper.png', this.run.bind(this))
    },

    /* Resize automatically the canvas, to make it responsive */
    resizeCanvas : () => {
        let self = engine
        let tempWidth = self.tileMap.width, tempHeight = self.tileMap.height

        /* Dimension of the general canvas */
        self.canvas.width = window.innerWidth
        self.canvas.height = window.innerHeight

        /* Dimensions of the tile map */
        self.tileMap.width = self.canvas.width
        self.tileMap.height = self.canvas.width * self.frameRatio

        /* Tile width and height responsive */
        self.tile.width = self.tileMap.width / self.screenTiles.x
        self.tile.height = self.tileMap.height / self.screenTiles.y

        /* Start points responsive -> rule of 3*/
        self.tileMap.startX = (self.tileMap.startX * self.tileMap.width) / tempWidth
        self.tileMap.startY = (self.tileMap.startY * self.tileMap.height) / tempHeight

    },

    /* Method call to draw every frame of the canvas */
    render: (timeSinceLastFrame) => {

        let self = engine
        //console.log("FPS: " + self.FPS)

        //Clean the screen before drawing
        self.context.clearRect(0, 0, self.canvas.width, self.canvas.height)

        if(self.controls.goUp){
            let oldPosition = self.tileMap.startY
            self.tileMap.startY ++

            if(self.detectColissions())
                self.tileMap.startY = oldPosition

            if(!character.moveInterval)
                character.onMovingForward()
        }
        

        if(self.controls.goDown){

            let oldPosition = self.tileMap.startY
            self.tileMap.startY --

            if(self.detectColissions())
                self.tileMap.startY = oldPosition
            
            if(!character.moveInterval)
                character.onMovingBackwards()
        }

        if(self.controls.goRight){

            let oldPosition = self.tileMap.startX
            self.tileMap.startX --

            if(self.detectColissions())
                self.tileMap.startX = oldPosition
            
            if(!character.moveInterval)
                character.onMovingRight()
        }
        
        if(self.controls.goLeft){

            let oldPosition = self.tileMap.startX
            self.tileMap.startX ++

            if(self.detectColissions())
                self.tileMap.startX = oldPosition

            if(!character.moveInterval)
                character.onMovingLeft()
        }

        /*  
            Draw the a rectangle surrounding the screen

            self.context.beginPath()
            self.context.rect(self.tileMap.startX, self.tileMap.startY, self.tileMap.width, self.tileMap.height)
            self.context.stroke()
        */

        self.calculateOffset()
        self.drawMap()
        self.drawObjects()
        self.drawCharacter()

        self.context.fillText(`FPS: ${self.FPS}`, self.tileMap.width - 100, 50)

        requestAnimationFrame(() => {

            /* FPS Counter */
            let now = new Date()
            timeSinceLastFrame = self.lastFrameTime ? (now - self.lastFrameTime): 0
            
            self.render(timeSinceLastFrame)

            self.lastFrameTime = now
            self.FPS = Math.floor(1/(timeSinceLastFrame/1000)) 
        })
    },


    /* Calculate which tiles are to be drawn within the screen */

    calculateOffset: function(){
        this.offSet.x = (this.tileMap.startX < 0) ? Math.floor((-this.tileMap.startX) / this.tile.width) : 0
        this.offSet.y = (this.tileMap.startY < 0) ? Math.floor((-this.tileMap.startY) / this.tile.height) : 0

        let offsetX =  this.screenTiles.x + Math.floor((-this.tileMap.startX) / this.tile.width)+1
        let offsetY = this.screenTiles.y + Math.floor((-this.tileMap.startY) / this.tile.height)+1

        this.offSet.xLimit = (offsetX > this.tileMap.tiles[0].length) ? this.tileMap.tiles[0].length: offsetX
        this.offSet.yLimit = (offsetY > this.tileMap.tiles.length) ? this.tileMap.tiles.length:offsetY
    },

    /* Draw Map function */
    drawMap: function(){

        for(let i =  this.offSet.y; i < this.offSet.yLimit; i++){
            for(let j = this.offSet.x; j < this.offSet.xLimit; j++)
                this.drawTile(j, i, this.tileMap.tiles)
        }
    },

    /* TEST to implement collisions */
    drawObjects : function(){
        for(let i =  this.offSet.y; i < this.offSet.yLimit; i++){
            for(let j = this.offSet.x; j < this.offSet.xLimit; j++){
                if(this.colission[i][j] != 0)
                    this.drawTile(j, i, this.colission)
            }   
        }
    },

    drawTile: function(xi, yi, matrix){

        let indexImage = this.tileImages.findIndex((elem) => elem.id === matrix[yi][xi])
        this.context.drawImage(this.tileImages[indexImage].img, xi * (this.tile.width) + this.tileMap.startX, yi * (this.tile.height) + this.tileMap.startY, this.tile.width, this.tile.height)

    },

    addControls: function(){
        window.addEventListener('keydown', () => {
            switch (event.key){
                case 'w':
                    this.controls.goUp = true
                    break

                case 's':
                    this.controls.goDown = true
                    break

                case 'a':
                    this.controls.goLeft = true
                    
                    break

                case 'd':
                    this.controls.goRight = true
                    break
            }

        })

        window.addEventListener('keyup', () => {
            switch (event.key){
                case 'w':
                    character.onMovingStop()
                    this.controls.goUp = false
                    break

                case 's':
                    character.onMovingStop()
                    this.controls.goDown = false
                    break

                case 'a':
                    character.onMovingStop()
                    this.controls.goLeft = false
                    break

                case 'd':
                    character.onMovingStop()
                    this.controls.goRight = false
                    break
            }

        })
    },

    /* Get the character position in the matrix */
    getPlayerPosition: function(){
        let posX = Math.floor(((this.tileMap.width / 2) - this.tileMap.startX) / this.tile.width)
        let posY = Math.floor(((this.tileMap.height / 2) - this.tileMap.startY) / this.tile.height)
        //console.log(`${posX}, ${posY}`)

        return {posX, posY}
    },

    drawCharacter: function(){
        let player = this.getPlayerRelativePosition()

        this.context.drawImage(character.spriteSheet.img, character.currentSprite.x * character.spriteSheet.width, character.currentSprite.y * character.spriteSheet.height
                                , character.spriteSheet.width, character.spriteSheet.height, player.posX, player.posY, this.tile.width, this.tile.height)
    },

    /* Character relative position */
    getPlayerRelativePosition: function(){
        let posX = this.tileMap.width/2 - (this.tile.width/2)
        let posY = this.tileMap.height/2 - (this.tile.height/2)

        return {posX, posY}
    },

    /* returns position of a given position in the matrix realtive to the screen */
    getTilesRelativePosition: function(x, y){
        let posX = x*this.tile.width + this.tileMap.startX
        let posY = y*this.tile.height + this.tileMap.startY

        return {posX, posY}
    },

    /* DETECT COLLISIONS IN THE TILE MAP */
    detectColissions: function(){

        for(let i = 0; i < this.colission.length; i++){
            for(let j = 0; j < this.colission[0].length; j++){
                if(this.colission[i][j] !== 0){

                    let relativePosition = this.getTilesRelativePosition(j, i)
                    let playerRelativePosition = this.getPlayerRelativePosition()

                    if((playerRelativePosition.posX + (this.tile.width/4) < relativePosition.posX + this.tile.width && playerRelativePosition.posX + (this.tile.width/4) + this.tile.width/2 > relativePosition.posX) 
                        && (playerRelativePosition.posY + (this.tile.width/8) < relativePosition.posY + this.tile.height && playerRelativePosition.posY + this.tile.height > relativePosition.posY)){
                        return true
                    }
                }
            }
        }

        
        return false
    }

}


export default engine;