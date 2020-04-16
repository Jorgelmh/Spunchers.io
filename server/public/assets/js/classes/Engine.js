import character from '../character.js'

/**
 * ============================
 *         ENGINE CLASS
 * ============================
 */

export default class Engine{

    constructor(map, collisionMatrix, tileset, canvas){

        /* General variables */
        this.canvas = canvas
        this.context  = this.canvas.getContext("2d")
        
        this.tileList = []
        this.tileImages = []
        this.localGame = null

        this.character = character
        /* Tile properties */

        this.tile = {
            width: null,
            height: null
        }

        /*  TileMap Object -> properties and tiles  */

        this.tileMap = {

            tileSet: tileset,
            tiles: map,
            startX: 200,
            startY: 200,
            width: 1280,
            height: 720
        }

        /* Tiles per screen */

        this.screenTiles= {
            x: 16,
            y: 9
        }

        this.frameDefaultDimensions = {
            width: 1280,
            height: 720
        }

        /* Calculate the average ratio of the screen */
        this.frameRatio= this.frameDefaultDimensions.height / this.frameDefaultDimensions.width

        this.offSet={
            x: null,
            y: null,
            xLimit: null,
            yLimit: null
        }

        /* FPS Counter */

        this.lastFrameTime = 0
        this.FPS = 0

        /* Controls */
        this.controls= {
            goUp: false,
            goDown: false,
            goRight: false,
            goLeft: false 
        }

        /* Collisionable */
        this.colissionMatrix = collisionMatrix

        window.addEventListener('resize', this.resizeCanvas)
        this.resizeCanvas()
        this.load()
    }

    /* 
        =================
            LOAD TILES
        =================
    */

    load(){

        console.log(this.tileList)
        console.log(this.tileImages)
        console.log(this.colissionMatrix)
        /* Retrieve single tile values */

        for(let i = 0; i < this.tileMap.tiles.length; i++){
            for(let j = 0; j < this.tileMap.tiles[0].length; j++){
                if(this.tileList.indexOf(this.tileMap.tiles[i][j]) < 0)
                    this.tileList.push(this.tileMap.tiles[i][j])

                if(this.colissionMatrix[i][j] !== 0 && this.tileList.indexOf(this.colissionMatrix[i][j]) < 0)
                    this.tileList.push(this.colissionMatrix[i][j])
            }
        }


        let loadedImages = 0 // Check if all images have been loaded
        for(let i = 0; i < this.tileList.length; i++){

            let tileImage = new Image()
            tileImage.onload = () => {
                if(++loadedImages >= this.tileList.length)
                    this.loadCharacter()
            }
            tileImage.src = `../tiles/tile_00${(this.tileList[i]<10) ? '0'+this.tileList[i]: this.tileList[i]}.png`

            this.tileImages.push({
                id: this.tileList[i],
                img: tileImage
            })
        }
    }

    loadCharacter(){
        this.character.load('stormtrooper.png', () => {
            requestAnimationFrame(this.render)
            this.addControls()
        })
    }

    /* Auto resize the canvas when the screen is resized */

    resizeCanvas = () =>{
        //let self = engine
        let tempWidth = this.tileMap.width, tempHeight = this.tileMap.height

        /* Dimension of the general canvas */
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        /* Dimensions of the tile map */
        this.tileMap.width = this.canvas.width
        this.tileMap.height = this.canvas.width * this.frameRatio

        /* Tile width and height responsive */
        this.tile.width = this.tileMap.width / this.screenTiles.x
        this.tile.height = this.tileMap.height / this.screenTiles.y

        /* Start points responsive -> rule of 3*/
        this.tileMap.startX = (this.tileMap.startX * this.tileMap.width) / tempWidth
        this.tileMap.startY = (this.tileMap.startY * this.tileMap.height) / tempHeight

    }

    /* Listeners for Controls */
    addControls(){
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
                    this.character.onMovingStop()
                    this.controls.goUp = false
                    break

                case 's':
                    this.character.onMovingStop()
                    this.controls.goDown = false
                    break

                case 'a':
                    this.character.onMovingStop()
                    this.controls.goLeft = false
                    break

                case 'd':
                    this.character.onMovingStop()
                    this.controls.goRight = false
                    break
            }

        })
    }

    /**
     * =================================
     *  GENERAL FUNCTIONS FOR RENDERING
     * =================================
     */

    /* Calculate which tiles are to be drawn within the screen */
    calculateOffset(){
        this.offSet.x = (this.tileMap.startX < 0) ? Math.floor((-this.tileMap.startX) / this.tile.width) : 0
        this.offSet.y = (this.tileMap.startY < 0) ? Math.floor((-this.tileMap.startY) / this.tile.height) : 0

        let offsetX =  this.screenTiles.x + Math.floor((-this.tileMap.startX) / this.tile.width)+1
        let offsetY = this.screenTiles.y + Math.floor((-this.tileMap.startY) / this.tile.height)+1

        this.offSet.xLimit = (offsetX > this.tileMap.tiles[0].length) ? this.tileMap.tiles[0].length: offsetX
        this.offSet.yLimit = (offsetY > this.tileMap.tiles.length) ? this.tileMap.tiles.length:offsetY
    }

    /* Draw Map function */
    drawMap(){

        for(let i =  this.offSet.y; i < this.offSet.yLimit; i++){
            for(let j = this.offSet.x; j < this.offSet.xLimit; j++)
                this.drawTile(j, i, this.tileMap.tiles)
        }
    }

    /* Draw objects from collision matrix */
    drawObjects(){
        for(let i =  this.offSet.y; i < this.offSet.yLimit; i++){
            for(let j = this.offSet.x; j < this.offSet.xLimit; j++){
                if(this.colissionMatrix[i][j] != 0)
                    this.drawTile(j, i, this.colissionMatrix)
            }   
        }
    }

    /* Draw single tile on the canvas */
    drawTile(xi, yi, matrix){

        let indexImage = this.tileImages.findIndex((elem) => elem.id === matrix[yi][xi])
        this.context.drawImage(this.tileImages[indexImage].img, xi * (this.tile.width) + this.tileMap.startX, yi * (this.tile.height) + this.tileMap.startY, this.tile.width, this.tile.height)

    }

    drawCharacter(player){

        this.context.drawImage(this.character.spriteSheet.img, this.character.currentSprite.x * this.character.spriteSheet.width, this.character.currentSprite.y * this.character.spriteSheet.height
                                , this.character.spriteSheet.width, this.character.spriteSheet.height, player.posX, player.posY, this.tile.width, this.tile.height)
    }


    /**
     *  =======================================
     *    FUNCTIONS TO CALCULATE POSITIONS
     *  =======================================
     */

    getPlayerPosition(){
        let posX = Math.floor(((this.tileMap.width / 2) - this.tileMap.startX) / this.tile.width)
        let posY = Math.floor(((this.tileMap.height / 2) - this.tileMap.startY) / this.tile.height)
        //console.log(`${posX}, ${posY}`)

        return {posX, posY}
    }

    /* Get player realtive position to the screen size */
    getPlayerRelativePosition(){
        let posX = this.tileMap.width/2 - (this.tile.width/2)
        let posY = this.tileMap.height/2 - (this.tile.height/2)

        return {posX, posY}
    }

    /* returns position of a given position in the matrix realtive to the screen */
    getTilesRelativePosition(x, y){
        let posX = x*this.tile.width + this.tileMap.startX
        let posY = y*this.tile.height + this.tileMap.startY

        return {posX, posY}
    }
}