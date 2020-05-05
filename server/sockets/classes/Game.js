/* Import Chat Class */
const OnlineChatServer = require('./OnlineChatServer')

/* Import character classes */
const Mikaela = require('./characters/Mikaela.js');
const Blade = require('./characters/Blade.js');

class Game {
    constructor(map, collisionMap, width, height, tileSet, io){

        /* Socket to use in case of specific state events */
        this.socketIO = io
        
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

        /* Create chat object */
        this.onlineChat = new OnlineChatServer()
    }
    /* Add Players */

    addPlayers(data, socketID){

        switch (data.skin) {
            case 'blade':
                this.players[socketID] = new Blade(600, 400, data.character, data.name)
                break

            case 'mikaela':
                this.players[socketID] = new Mikaela(600, 400, data.character, data.name)
                break
        }

        /*
        this.players[socketID] = {
            posX: 600,
            posY: 400,
            life: 100,
            character: {
                currentSprite: data.character
            },
            shooting: null,
            skin: data.skin,
            playerName: data.name,
            score: 0,
            ableToShoot:  true,
            lastDeath: Date.now()
        }
        */
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

    addBullet(playerID){

        let currentPlayer = this.players[playerID]
        let bullet = this.emitBullet(playerID)

        currentPlayer.shooting = true

        setTimeout(() => {
            currentPlayer.shooting = false
        }, 90)

        this.bullets.push({
                ownerID: playerID,
                posX: bullet.posX,
                posY: bullet.posY,
                dirX: bullet.dirX,
                dirY: bullet.dirY
        }) 

        currentPlayer.ableToShoot = false

        setTimeout(() => currentPlayer.ableToShoot = true, this.players[playerID].shootingDelay)
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
            bullets: this.bullets,
            serverTime: Date.now()
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

                        this.players[playerID].life = (this.players[playerID].life - this.players[bullet.ownerID].impactDamage < 0) ? 0 : this.players[playerID].life - this.players[bullet.ownerID].impactDamage

                        if(this.players[playerID].life <= 0){
                            this.players[bullet.ownerID].score ++
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

        /* Synn check time */
        this.players[playerID].lastDeath = Date.now()
        
        let currentPlayer = this.players[playerID]
        let newPosition = this.respawnPlayerPosition()

        this.bullets = this.bullets.filter((elem) => elem.ownerID !== playerID )

        if(currentPlayer){

            setTimeout(() => {
                currentPlayer.life = 100
                currentPlayer.posX = newPosition.x
                currentPlayer.posY = newPosition.y
                this.socketIO.sockets.emit('state', this.update())
            }, 1000) 
        }

        /* Emit new leaderboard */
        this.socketIO.sockets.emit('New leaderboard', this.sortScores(this.players))
                
    }

    respawnPlayerPosition(){
        return {
            x: 0,
            y: 0
        }
    }

    /**
     * =========================
     *  Sending Updated Scores
     * =========================
     *
    */

    /* Insertion sort application to find the 3 highest scores -> returns 3 names and scores */
    sortScores(hashMap){

        let arr = Object.keys(hashMap)
        let newArr = []

        let length = (arr.length < 3) ? arr.length : 3
        for(let i = 0; i < length ; i++){
            let greaterScore = i

            for(let j = i+1; j < arr.length; j++){
                if(hashMap[arr[j]].score > hashMap[arr[greaterScore]].score)
                    greaterScore = j
                
            }
            let temp = arr[i]
            arr[i] = arr[greaterScore]
            arr[greaterScore] = temp

            newArr.push({
                id: arr[i],
                name: hashMap[arr[i]].playerName,
                score: hashMap[arr[i]].score
            })
        }

        return newArr
    }

    /**
     * =======================
     *      Online Chat
     * =======================
     */

     addChatMessage(message, socket, adminID){

        /* Add the message if it's not a command and return true */
        let isAdmin = (adminID === process.env.AdminKey)
        let command = this.onlineChat.checkCommand(message, isAdmin)

        if(!command){
            this.onlineChat.addMessage(this.players[socket.id].playerName, message)

            if(isAdmin)
                return `${this.players[socket.id].playerName} [<i class="fas fa-user-check"></i>]`
            else
                return this.players[socket.id].playerName

        }else{

            if(command.keyword === 'ban'){
                let playerID = Object.keys(this.players).find((elem) => this.players[elem].playerName === command.name)
                
                if(playerID){
                    delete this.players[playerID]
                    this.socketIO.to(playerID).emit('banned')
                    this.socketIO.sockets.emit('state', this.update())
                }
            }
        }
     }

     /* Commands */

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

    /* Emit Bullet */
    emitBullet(playerID){
        let halfServerTileWidth = this.tile.width/2
        let dirX, dirY, posX = this.players[playerID].posX + halfServerTileWidth, posY = this.players[playerID].posY

        switch (this.players[playerID].character.currentSprite.y){
            case 0:
                dirX = 0
                dirY = 1 
                posY+= halfServerTileWidth*2
                break
            case 1:
                dirX = -1
                dirY = 0
                break
            case 2:
                dirX = 1
                dirY = 0
                break
            case 3:
                dirY = -1
                dirX = 0
                posX+=(halfServerTileWidth/4)
                break
            case 4:
                if(this.players[playerID].character.currentSprite.x == 0){
                    dirX = 1
                    dirY = 0
                }else{
                    dirX = Math.sin(Math.PI / 4)
                    dirY = - Math.sin(Math.PI / 4)
                }
                break

            case 5: 
                if(this.players[playerID].character.currentSprite.x == 0){
                    dirX = -1
                    dirY = 0
                }else{
                    dirX = -Math.sin(Math.PI / 4)
                    dirY = - Math.sin(Math.PI / 4)
                }
                break
            case 6:
                if(this.players[playerID].character.currentSprite.x == 0){
                    dirX = 1
                    dirY = 0
                }else{
                    dirX = Math.sin(Math.PI / 4)
                    dirY = Math.sin(Math.PI / 4)
                }
                break
            case 7:
                if(this.players[playerID].character.currentSprite.x == 0){
                    dirX = -1
                    dirY = 0
                }else{
                    dirX = -Math.sin(Math.PI / 4)
                    dirY = Math.sin(Math.PI / 4)
                }
                break

        }

        if(this.players[playerID].character.currentSprite.y === 1 || this.players[playerID].character.currentSprite.y === 2 
            || (this.players[playerID].character.currentSprite.y >= 4 && this.players[playerID].character.currentSprite.x === 0))
            posY+=halfServerTileWidth + (halfServerTileWidth/6)

        if((this.players[playerID].character.currentSprite.y === 4 || this.players[playerID].character.currentSprite.y === 5) && this.players[playerID].character.currentSprite.x != 0){
            posX+=(halfServerTileWidth * dirX)
            posY+=(halfServerTileWidth * -dirY)
        }

        if((this.players[playerID].character.currentSprite.y === 6 || this.players[playerID].character.currentSprite.y === 7) && this.players[playerID].character.currentSprite.x != 0){
            posX+=(halfServerTileWidth * dirX)
            posY+=(halfServerTileWidth + halfServerTileWidth * dirY)
        }

        let bullet = {
            posX,
            posY,
            dirX: dirX,
            dirY: dirY
        }

        return bullet
    }

}

module.exports = Game