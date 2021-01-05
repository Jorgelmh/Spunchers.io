/* Import Chat Class */
const OnlineChatServer = require('./OnlineChatServer')

/* Import character classes */
const Mikaela = require('./characters/Mikaela.js');
const Blade = require('./characters/Blade.js');
const Rider = require('./characters/Rider.js')

class Game {
    constructor(map, io){

        /* Socket to use in case of specific state events */
        this.socketIO = io
        
        /* Arrays for players and active bullets */
        this.players = {}
        this.bullets = []
        this.bulletSpeed = 200

        this.characterSpeed = 1.5

        this.bulletWidth = 10

        this.shootingInterval = null

        /* 
             ====================
                Map features 
             ====================
        */

        /* Matrix for map and collisionMap */

        this.tileSet = map.tileSet
        this.map = map.tileMap
        this.collisionMatrix = map.collisionMap
        this.shadowMap = map.shadowMatrix

        /* Dimensions of the server */
        this.width = map.dimensions.width
        this.height = map.dimensions.height

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

        this.ratioMovement = this.tilesDimension.x/ this.tilesDimension.y

        /* Create chat object */
        this.onlineChat = new OnlineChatServer()

        /* Manage updates */
        this.updateInterval = null
        this.sendState = false
    }
    /* Add Players */

    addPlayers(data, socketID){

        switch (data.skin) {
            case 'blade':
                this.players[socketID] = new Blade(600, 200, data.character, data.name)
                break

            case 'mikaela':
                this.players[socketID] = new Mikaela(600, 200, data.character, data.name)
                break
            case 'rider':
                this.players[socketID] = new Rider(600, 200, data.character, data.name)
            
        }
    }

    /* Remove Player ->  recieves the socket id as the parameter */

    removePlayer = (id) => {
        delete this.players[id]  
    }

    /* change position of players when the movement events on the client are triggered */
    onMovement = (socketID, data) => {

        let currentPlayer = this.players[socketID]

        if(currentPlayer){

            currentPlayer.character = data.character
            currentPlayer.cartesianValueOfMovement = data.cartisianMovement
            currentPlayer.still = true

            if(currentPlayer.life > 0 && (data.movement.x !== 0 || data.movement.y !== 0)){

                currentPlayer.still = false

                /* Movement on X */
                let oldPositionX = currentPlayer.posX
                currentPlayer.posX += data.movement.x

                if(this.detectCollisions(currentPlayer))
                    currentPlayer.posX = oldPositionX

                /* Movement on Y */
                let oldPositionY = currentPlayer.posY
                currentPlayer.posY += data.movement.y

                if(this.detectCollisions(currentPlayer))
                    currentPlayer.posY = oldPositionY
            }
        }
    }

    /* Detect colission between players and objects on the server */

    detectCollisions(player){

        for(let i = 0; i < this.collisionMatrix.length; i++){
            for(let j = 0; j < this.collisionMatrix[0].length; j++){
                if(this.collisionMatrix[i][j] !== 0){
    
                    /* Check if exists a collision => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
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

    addBullet = (playerID, bullet, shootTime) => {

        if(shootTime > this.players[playerID].lastDeath && this.players[playerID].life > 0 
            && this.players[playerID].ableToShoot && this.players[playerID].bulletsCharger > 0){

                let currentPlayer = this.players[playerID]
                let bulletPosition = this.emitBullet(playerID)

            if(Date.now() - currentPlayer.lastShot > currentPlayer.shootingDelay){


                currentPlayer.shooting = true
                currentPlayer.reduceAmmunition(this.emitReload, playerID)

                currentPlayer.lastShot = Date.now()

                setTimeout(() => {
                    currentPlayer.shooting = false
                }, 90)

                /* Push bullet onto the array of bullets */
                this.bullets.push({
                    ownerID: playerID,
                    posX: bulletPosition.x,
                    posY: bulletPosition.y,
                    dirX: bullet.dir.x,
                    dirY: bullet.dir.y,
                    flip: this.players[playerID].character.currentSprite.flip,
                    spriteY: bullet.spriteY
                }) 
            }
        }
    }

    update(date){

        let now = new Date()
        this.lastRefresh = date || this.lastRefresh
        let dt = (now - this.lastRefresh)/1000
        this.lastRefresh = now

        if(this.bullets.length > 0)
            this.updateBulletsPosition(dt)

        /* return only the info the user needs to know about the players */
        let clientPlayers = Object.fromEntries(Object.entries(this.players).map(([id, player]) => [id, player.playerState()]))
        return {
            players: clientPlayers,
            bullets: this.bullets,
            serverTime: Date.now()
        }

    }

    /** 
     * =================================
     *        Update Game state
     * =================================
    */

    setUpdate(){
        this.updateInterval = setInterval(() => {

            /* Send state to sockets */
            let state = this.update()
            
            if(this.sendState){
                this.socketIO.sockets.emit('state', state)
                this.sendState = false
            }
            else
                this.sendState = true

        }, 1000 / 60)
    }

    updateBulletsPosition(dt){

        /* Loop each bullet to see if they've hit any target while this update */
        for(let i = 0; i < this.bullets.length; i++){

            let bullet = this.bullets[i]
            let removeBullet = false

            /* Update current position of each bullet */
            bullet.posX += dt * this.bulletSpeed * bullet.dirX
            bullet.posY += dt * this.bulletSpeed * bullet.dirY

            /* Check collisions between bullets and objects in the tile map -> using the coordinates of the bullet at the moment of collision */
            let bulletPosXMatrix = Math.floor(bullet.posX / this.tile.width) 
            let bulletPosYMatrix = Math.floor(bullet.posY / this.tile.height)

            /* If it didn't collide with a sturcture then apply further checks to see if it does to a player */
            if(!((bulletPosYMatrix >= 0 && bulletPosYMatrix < this.tilesDimension.y) && (bulletPosXMatrix >= 0 && bulletPosXMatrix < this.tilesDimension.x ) 
                && (!Array.isArray(this.collisionMatrix[bulletPosYMatrix][bulletPosXMatrix]) && this.collisionMatrix[bulletPosYMatrix][bulletPosXMatrix] !== 0))){

                    /* Check collisions with players */
                    for(let playerID in this.players){

                        if(playerID != bullet.ownerID && this.players[playerID].life > 0 && (this.players[playerID].posX + (this.tile.width/2) < bullet.posX + this.bulletWidth && this.players[playerID].posX + (this.tile.width/4) + (this.tile.width/2) > bullet.posX) 
                            && (this.players[playerID].posY + (this.tile.width/2) < bullet.posY + this.bulletWidth && this.players[playerID].posY + this.tile.height > bullet.posY)){
        
                                this.players[playerID].life = (this.players[playerID].life - this.players[bullet.ownerID].impactDamage < 0) ? 0 : this.players[playerID].life - this.players[bullet.ownerID].impactDamage
        
                                if(this.players[playerID].life <= 0){
                                    this.players[bullet.ownerID].score ++
                                    this.playerHasDied(playerID)
                                }
                                removeBullet = true
                                break
                        }
        
                    }
            }else
                removeBullet = true
            

            if(removeBullet){
                this.bullets.splice(i, 1)
                i--
            }
            
        }
    }

    /**
     * ========================
     *      RELOAD WEAPON
     * ========================
     */

    reloadPlayerWeapon(playerID){
        this.players[playerID].reloadWeapon(this.emitReload, playerID)
    }

    emitReload = (playerID) => {
        this.socketIO.to(playerID).emit('Reload Weapon')
    }

    /**
     *  =========================================
     *      Detect if a bullet impacts a player
     *  =========================================
     * 
     */

    checkCollisionsWithBullets(bullet){

        if(Object.keys(this.players).length > 1){

            /* Use for loop instead of array methods so the loop is broken whenever the colission happens -> don't keep looping if there's a colission */
            for(let playerID in this.players){

                /* Check if exists a colission => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
                if(playerID != bullet.ownerID && this.players[playerID].life > 0 && (this.players[playerID].posX + (this.tile.width/2) < bullet.posX + this.bulletWidth && this.players[playerID].posX + (this.tile.width/4) + (this.tile.width/2) > bullet.posX) 
                    && (this.players[playerID].posY + (this.tile.width/2) < bullet.posY + this.bulletWidth && this.players[playerID].posY + this.tile.height > bullet.posY)){

                        this.players[playerID].life = (this.players[playerID].life - this.players[bullet.ownerID].impactDamage < 0) ? 0 : this.players[playerID].life - this.players[bullet.ownerID].impactDamage

                        if(this.players[playerID].life <= 0){
                            this.players[bullet.ownerID].score ++
                            this.playerHasDied(playerID)
                        }
                        return true
                }
            }
        }


        
    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

    playerHasDied(playerID){

        /* Synn check time */
        this.players[playerID].lastDeath = Date.now()

        /* Reload user's weapon when died */
        this.players[playerID].bulletsCharger = this.players[playerID].ammunition
        this.emitReload(playerID)
        
        let currentPlayer = this.players[playerID]
        let newPosition = this.respawnPlayerPosition()

        this.bullets = this.bullets.filter((elem) => elem.ownerID !== playerID )

        if(currentPlayer){

            setTimeout(() => {
                currentPlayer.life = 100
                currentPlayer.posX = newPosition.x
                currentPlayer.posY = newPosition.y
                if(this.bullets.length === 0)
                    this.socketIO.sockets.emit('state', this.update())
            }, 1000) 
        }

        /* Emit new leaderboard */
        this.socketIO.sockets.emit('New leaderboard', this.sortScores(this.players))
                
    }

    respawnPlayerPosition(){
        return {
            x: 600,
            y: 200
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
                    if(this.bullets.length === 0)
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
    getSkins(playerID){
        let srcArray = []

        for(let playerID in this.players){
            if(srcArray.indexOf(this.players[playerID].skin))
                srcArray.push(this.players[playerID].skin)
        }   

        return {
            srcArray,
            characterInfo: {
                bullets: this.players[playerID].ammunition,
                shootingDelay: this.players[playerID].shootingDelay
            }
        }
    }

    /* Data that is needed to be loaded before the game can run */
    onLoadMap(id){
        return {
            lobby: {
                map: this.map,
                collisionMatrix: this.collisionMatrix,
                shadowMap: this.shadowMap,
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

        /* Reference width to calculate offset*/
        let halfServerTileWidth = this.tile.width/2
        let halfServerTileHeight = this.tile.height/2

        let pos = {
            x: this.players[playerID].posX + halfServerTileWidth,
            y: this.players[playerID].posY
        }

        /* Adding extra offset to bullets position*/

        if(this.players[playerID].character.currentSprite.y === 0)
            pos.y += halfServerTileWidth*2

        if(this.players[playerID].character.currentSprite.y === 2)
            pos.x += this.tile.width/6

        if(this.players[playerID].character.currentSprite.y === 1 || this.players[playerID].character.currentSprite.y === 5)
            pos.y += this.players[playerID].offsetYHorizontal(halfServerTileWidth) 

        if(this.players[playerID].character.currentSprite.y === 3){
            pos.x += this.players[playerID].diagonalUpOffsetX(halfServerTileWidth, this.players[playerID].character.currentSprite.flip) 
            pos.y += this.players[playerID].diagonalUpOffsetY(halfServerTileHeight)
        }

        if(this.players[playerID].character.currentSprite.y === 4){
            pos.x += this.players[playerID].diagonalDownOffsetX(halfServerTileWidth, this.players[playerID].character.currentSprite.flip) 
            pos.y += this.players[playerID].diagonalDownOffsetY(halfServerTileHeight)
        }

        return pos
    }

}

module.exports = Game