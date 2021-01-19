/* Import Chat Class */
const OnlineChatServer = require('../OnlineChatServer')

class Game {
    constructor(map, io){

        /* Socket to use in case of specific state events */
        this.socketIO = io
        
        this.bulletSpeed = 200

        this.characterSpeed = 1.5

        this.bulletWidth = 10

        this.shootingInterval = null

        /* Constant of interpolation */
        this.interpolationDelay = (process.env.AdminKey === 200) ? 5 : 100

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

        /* respawn vectors */
        this.respawnPoints = map.respawns

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

        this.setUpdate()
    }


    /* change position of players when the movement events on the client are triggered */
    onMovement = (player, data, socketID) => {

        if(!player)
            this.socketIO.to(socketID).emit('banned')

        /* Only store user's state when they are alive */
        if(player.life > 0){
            if(player.lastUpdate === 0)
                this.calculateMovement(player, data)
            
            player.buffer.push(data)
        }
        
    }

    /* Trigger movement of players */
    calculateMovement(player, data){

        let currentPlayer = player

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

    addBullet = (player, bullet, shootTime, playerID, bulletsArray = this.bullets) => {

        if(shootTime > player.lastDeath && player.life > 0 
            && player.ableToShoot && player.bulletsCharger > 0){

                let bulletPosition = this.emitBullet(player)

            if(Date.now() - player.lastShot > player.shootingDelay){

                /* Set shooting state which is translated to a shooting animation on the client */
                player.shooting = true
                player.reduceAmmunition(this.emitReload, playerID)

                player.lastShot = Date.now()

                setTimeout(() => {
                    player.shooting = false
                }, 90)

                /* Create bullet based on the character -> Different characters different kind of bullets */
                let characterBullet = player.createBullet(playerID, bulletPosition, bullet)

                /* Push bullet/s onto the array of bullets */
                bulletsArray.push(...characterBullet) 
            }
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
                this.socketIO.to(this.roomname).emit('state', state)
                this.sendState = false
            }
            else
                this.sendState = true

        }, 1000 / 60)
    }

    /* calculate collisions against a given hash table of players and bullets */
    updateBulletsPosition(dt, players = this.players, bullets = this.bullets){

        /* Loop each bullet to see if they've hit any target while this update */
        for(let i = 0; i < bullets.length; i++){

            let bullet = bullets[i]
            let removeBullet = false

            /* Update current position of each bullet */
            bullet.posX += dt * this.bulletSpeed * bullet.dirX
            bullet.posY += dt * this.bulletSpeed * bullet.dirY

            /* Check distance travelled by bullet -> if it has a limit */
            if(bullet.range){

                /* calculate vector from point 0,0*/
                let vector = {
                    x: bullet.posX - bullet.initialPos.x,
                    y: bullet.posY - bullet.initialPos.y
                }
                
                let distanceTravelled = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))

                if(distanceTravelled > bullet.range)
                    removeBullet = true
                
            }

            /* Check collisions between bullets and objects in the tile map -> using the coordinates of the bullet at the moment of collision */
            let bulletPosXMatrix = Math.floor(bullet.posX / this.tile.width) 
            let bulletPosYMatrix = Math.floor(bullet.posY / this.tile.height)

            /* If it didn't collide with a sturcture then apply further checks to see if it does to a player */
            if(!((bulletPosYMatrix >= 0 && bulletPosYMatrix < this.tilesDimension.y) && (bulletPosXMatrix >= 0 && bulletPosXMatrix < this.tilesDimension.x ) 
                && (!Array.isArray(this.collisionMatrix[bulletPosYMatrix][bulletPosXMatrix]) && this.collisionMatrix[bulletPosYMatrix][bulletPosXMatrix] !== 0))){

                    /* Check collisions with players */
                    for(let playerID in players){

                        if(playerID != bullet.ownerID && players[playerID].life > 0 && (players[playerID].posX + (this.tile.width/2) < bullet.posX + this.bulletWidth && players[playerID].posX + (this.tile.width/4) + (this.tile.width/2) > bullet.posX) 
                            && (players[playerID].posY + (this.tile.width/2) < bullet.posY + this.bulletWidth && players[playerID].posY + this.tile.height > bullet.posY)){
        
                                players[playerID].life = this.reduceLife(playerID, bullet.ownerID)
        
                                if(players[playerID].life <= 0){
                                    this.setScore(bullet.ownerID)
                                    this.playerHasDied(playerID)
                                }
                                removeBullet = true
                                break
                        }
        
                    }
            }else
                removeBullet = true
            

            if(removeBullet){
                bullets.splice(i, 1)
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

    respawnPlayerPosition(){

        let randomIndex = Math.floor(Math.random() * 6)

        return this.respawnPoints[randomIndex]
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
    emitBullet(player){

        /* Reference width to calculate offset*/
        let halfServerTileWidth = this.tile.width/2
        let halfServerTileHeight = this.tile.height/2

        let pos = {
            x: player.posX + halfServerTileWidth,
            y: player.posY
        }

        /* Adding extra offset to bullets position*/

        if(player.character.currentSprite.y === 0)
            pos.y += halfServerTileWidth*2

        if(player.character.currentSprite.y === 2)
            pos.x += this.tile.width/6

        if(player.character.currentSprite.y === 1 || player.character.currentSprite.y === 5)
            pos.y += player.offsetYHorizontal(halfServerTileWidth) 

        if(player.character.currentSprite.y === 3){
            pos.x += player.diagonalUpOffsetX(halfServerTileWidth, player.character.currentSprite.flip) 
            pos.y += player.diagonalUpOffsetY(halfServerTileHeight)
        }

        if(player.character.currentSprite.y === 4){
            pos.x += player.diagonalDownOffsetX(halfServerTileWidth, player.character.currentSprite.flip) 
            pos.y += player.diagonalDownOffsetY(halfServerTileHeight)
        }

        return pos
    }

}

module.exports = Game