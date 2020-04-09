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

        this.resizeCanvas()
        this.addControls()

        requestAnimationFrame(this.render)
    },

    load: function(map, tileSet){

        this.tileMap.tileSet = tileSet
        this.tileMap.tiles = map

        /* Retrieve single tile values */
        for(let row of map){
            for(let element of row){
                if(this.tileList.indexOf(element) < 0)
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
            self.tileMap.startY ++
            if(!character.moveInterval)
                character.onMovingForward()
        }
        

        if(self.controls.goDown){
            self.tileMap.startY --
            if(!character.moveInterval)
                character.onMovingBackwards()
        }

        if(self.controls.goRight){
            self.tileMap.startX --
            if(!character.moveInterval)
                character.onMovingRight()
        }
        
        if(self.controls.goLeft){
            self.tileMap.startX ++
            if(!character.moveInterval)
                character.onMovingLeft()
        }

        /*  
            Draw the a rectangle surrounding the screen

            self.context.beginPath()
            self.context.rect(self.tileMap.startX, self.tileMap.startY, self.tileMap.width, self.tileMap.height)
            self.context.stroke()
        */

        self.getPlayerPosition()
        self.drawMap()
        self.drawCharacter()

        requestAnimationFrame(() => {

            /* FPS Counter */
            let now = new Date()
            timeSinceLastFrame = self.lastFrameTime ? (now - self.lastFrameTime): 0
            
            self.render(timeSinceLastFrame)

            self.lastFrameTime = now
            self.FPS = Math.floor(1/(timeSinceLastFrame/1000)) 
        })
    },

    /* Draw Map function */
    drawMap: function(){

        let offsetX = (this.tileMap.startX < 0) ? Math.floor((-this.tileMap.startX) / this.tile.width) : 0
        let offsetXLimit = (offsetX + this.screenTiles.x > this.tileMap.tiles[0].length) ?  this.tileMap.tiles[0].length: this.screenTiles.x + offsetX

        let offsetY = (this.tileMap.startY < 0) ? Math.floor((-this.tileMap.startY) / this.tile.height) : 0
        let offsetYLimit = (offsetY+this.screenTiles.y > this.tileMap.tiles.length) ? this.tileMap.tiles.length: offsetY + this.screenTiles.y

        for(let i =  offsetY; i < offsetYLimit; i++){
            for(let j = offsetX; j < offsetXLimit; j++)
                this.drawTile(j, i)

        }
    },

    drawTile: function(xi, yi){

        let indexImage = this.tileImages.findIndex((elem) => elem.id === this.tileMap.tiles[yi][xi])

        this.context.fillText(`FPS: ${this.FPS}`, this.tileMap.width - 100, 50)
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
    },

    drawCharacter: function(){
        this.context.drawImage(character.spriteSheet.img, character.currentSprite.x * character.spriteSheet.width, character.currentSprite.y * character.spriteSheet.height
                                , character.spriteSheet.width, character.spriteSheet.height, this.tileMap.width/2 - (this.tile.width/2), this.tileMap.height/2 - (this.tile.height/2), this.tile.width, this.tile.height)
    }

}


export default engine;