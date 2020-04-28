class Game {
    constructor(map, collisionMap, width, height, tileSet){

        /* Arrays for players and active bullets */
        this.players = {}
        this.bullets = []
        this.bulletSpeed = 400

        this.characterSpeed = 1

        this.bulletWidth = 10

        this.shootingInterval = null

        /* 
             ====================
                Map features 
             ====================
        */

        /* Matrix for map and collisionMap */

        this.tileSet = tileSet
        this.map = map
        this.colissionMatrix = collisionMap

        /* Dimensions of the server */
        this.width = width
        this.height = height

        this.tilesDimension = {
            x: this.map[0].length,
            y: this.map.length
        }

        /* Dimension of a tile on the game running on the server */
        this.tile = {
            width : this.width / this.tilesDimension.x,
            height : this.height / this.tilesDimension.y
        }

        /* Bullets movement */
        this.lastRefresh = Date.now()
    }
    /* Add Players */

    addPlayers(data, socketID){

        this.players[socketID] = {
            posX: 600,
            posY: 400,
            life: 100,
            character: {
                currentSprite: data.character
            },
            shooting: null,
            skin: data.skin,
            playerName: data.name
        }
    }

    /* Remove Player ->  recieves the socket id as the parameter */

    removePlayer = (id) => {
        delete this.players[id]  
    }

    /* change position of players when the movement events on the client are triggered */
    onMovement = (data) => {

        let currentPlayer = this.players[data.id]

        if(currentPlayer){
            currentPlayer.character = data.character

            if(currentPlayer.life > 0){

                if(data.controls.goUp){
                    let oldPosition = currentPlayer.posY
                    currentPlayer.posY -=this.characterSpeed
    
                    if(this.detectColissions(currentPlayer)){
                        currentPlayer.posY = oldPosition
                    }
                }
    
                if(data.controls.goDown){
                    let oldPosition = currentPlayer.posY
                    currentPlayer.posY += this.characterSpeed
    
                    if(this.detectColissions(currentPlayer)){
                        currentPlayer.posY = oldPosition
                    }
                }
    
                if(data.controls.goLeft){
                    let oldPosition = currentPlayer.posX
                    currentPlayer.posX -= this.characterSpeed
    
                    if(this.detectColissions(currentPlayer)){
                        currentPlayer.posX = oldPosition
                    }
                }
                    
    
                if(data.controls.goRight){
                    let oldPosition = currentPlayer.posX
                    currentPlayer.posX += this.characterSpeed
    
                    if(this.detectColissions(currentPlayer)){
                        currentPlayer.posX = oldPosition
                    }
    
                }
            }
        }
    }

    /* Detect colission between players and objects on the server */

    detectColissions(player){

        for(let i = 0; i < this.colissionMatrix.length; i++){
            for(let j = 0; j < this.colissionMatrix[0].length; j++){
                if(this.colissionMatrix[i][j] !== 0){
    
                    /* Check if exists a colission => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
                    if((j*this.tile.width < player.posX + (this.tile.width/4) + (this.tile.width/2) && j*this.tile.width + this.tile.width > player.posX + (this.tile.width/4)) 
                        && (i*this.tile.height< player.posY + this.tile.height && i*this.tile.height + this.tile.height > player.posY + 3*(this.tile.width/4))){
                        return true
                    }
                }
            }
        }
        return false
    }

    /**
     * ========================
     *      Bullets movement
     * ========================
     */

    addBullet(data, playerID){

        let currentPlayer = this.players[playerID]

        currentPlayer.shooting = true

        setTimeout(() => {
            currentPlayer.shooting = false
        }, 90)
        this.bullets.push({
            ownerID: playerID,
            posX: data.posX,
            posY: data.posY,
            dirX: data.dirX,
            dirY: data.dirY
        })
    }

    update(date){

        let now = new Date()
        this.lastRefresh = date || this.lastRefresh
        let dt = (now - this.lastRefresh)/1000
        this.lastRefresh = now

        if(this.bullets.length > 0)
            this.updateBulletsPosition(dt)

        return {
            players: this.players,
            bullets: this.bullets
        }
    }

    updateBulletsPosition(dt){
        this.bullets.forEach((element, index) => {
            element.posX += dt * this.bulletSpeed * element.dirX
            element.posY += dt * this.bulletSpeed * element.dirY

            if(this.checkColissionsWithBullets(element) || (element.posX > this.width || element.posX < 0 || element.posY < 0 || element.posY > this.height))
                this.bullets.splice(index, 1)
        })
    }

    /**
     *  =========================================
     *      Detect if a bullet impacts a player
     *  =========================================
     * 
     */

    checkColissionsWithBullets(bullet){

        if(Object.keys(this.players).length > 1){

            /* Use for loop instead of array methods so the loop is broken whenever the colission happens -> don't keep looping if there's a colission */
            for(let playerID in this.players){

                /* Check if exists a colission => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
                if(playerID != bullet.ownerID && this.players[playerID].life > 0 && (this.players[playerID].posX + (this.tile.width/4) < bullet.posX + this.bulletWidth && this.players[playerID].posX + (this.tile.width/4) + (this.tile.width/2) > bullet.posX) 
                    && (this.players[playerID].posY + (this.tile.width/4) < bullet.posY + this.bulletWidth && this.players[playerID].posY + this.tile.height > bullet.posY)){

                        this.players[playerID].life = (this.players[playerID].life - 33.4 < 0) ? 0 : this.players[playerID].life - 33.4

                        if(this.players[playerID].life <= 0){
                            this.playerHasDied(playerID)
                        }
                        return true
                }
            }
        }
        return false
    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

    playerHasDied(playerID){
        let currentPlayer = this.players[playerID]
        let newPosition = this.respawnPlayerPosition()

        if(currentPlayer){

            setTimeout(() => {
                currentPlayer.life = 100
                currentPlayer.posX = newPosition.x
                currentPlayer.posY = newPosition.y
            }, 1000) 
        }
        
    }

    respawnPlayerPosition(){
        return {
            x: 0,
            y: 0
        }
    }
    /**
     *  ==================
     *       Getters
     *  ==================
     */

    /* Return non-repeated values of skins */
    getSkins(){
        let srcArray = []

        for(let playerID in this.players){
            if(srcArray.indexOf(this.players[playerID].skin))
                srcArray.push(this.players[playerID].skin)
        }   

        return srcArray
    }

    /* Data that is needed to be loaded before the game can run */
    onLoadMap(id){
        return {
            lobby: {
                map: this.map,
                colissionMatrix: this.colissionMatrix,
                tileSet: this.tileSet,
                server : {
                    width: this.width,
                    height: this.height
                }
            },
            playerID: id
        }
    }

}

module.exports = Game