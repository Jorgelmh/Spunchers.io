/* Import supper class for game modes -> abstract logic */
const Game = require('./Game')

/**
 *  =============================
 *          FREE FOR ALL
 *  =============================
 */
class FreeforAll extends Game{

    constructor(map, io){
        super(map, io)

        /* Room name */
        this.roomname = 'freeforall'

        /* Arrays for players and active bullets */
        this.players = {}
        this.bullets = []

        /* Gamemode-code */
        this.gameCode = 0
    }

    /**
     *  ==========================
     *         UPDATE STATE
     *  ==========================
     */

    update(date){

        let now = new Date()
        this.lastRefresh = date || this.lastRefresh
        let dt = (now - this.lastRefresh)/1000
        this.lastRefresh = now

        if(this.bullets.length > 0)
            this.updateBulletsPosition(dt)        

        /* return only the info the user needs to know about the players */
        let clientPlayers = this.serializePlayers(this.players)

        /* Check bonus position */
        let bonusKits = this.checkBonusKits()

        return {
            players: clientPlayers,
            bullets: this.bullets,
            serverTime: Date.now(),
            bonusKits
        }

    }

    /* Remove Player ->  recieves the socket id as the parameter */

    removePlayer = (id) => {
        delete this.players[id] 

        if(Object.keys(this.players).length === 0) this.onlineChat.messages = []
        this.socketIO.to(this.roomname).emit('New leaderboard', this.sortScores(this.players))
    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

   playerHasDied(playerID){

        /* Sync check time */
        this.players[playerID].lastDeath = Date.now()
        this.players[playerID].deaths ++

        /* Reload user's weapon when died */
        this.players[playerID].bulletsCharger = this.players[playerID].ammunition
        this.emitReload(playerID)
        
        let currentPlayer = this.players[playerID]
        let newPosition = this.respawnPlayerPosition()

        this.bullets = this.bullets.filter((elem) => elem.ownerID !== playerID)

        let tempFlip = currentPlayer.character.currentSprite.flip

        /* Set death animations */
        currentPlayer.character.currentSprite = {
            x: 0,
            y: 12,
            flip: tempFlip
        }

        if(currentPlayer){

            setTimeout(() => {
                currentPlayer.life = 100
                currentPlayer.posX = newPosition.x
                currentPlayer.posY = newPosition.y

                currentPlayer.character.currentSprite = {
                    x: 0,
                    y: 5,
                    flip: tempFlip
                }

            }, 1000) 
        }

        /* Emit new leaderboard */
        this.socketIO.to(this.roomname).emit('New leaderboard', this.sortScores(this.players))
            
    }

    /* Change score of a player */
    setScore(playerID){
        this.players[playerID].kills ++
    }

    /* Reduce life of a hit player */
    reduceLife(hitID, shooterID){
        this.players[hitID].lastHit = Date.now()
        return (this.players[hitID].life - this.players[shooterID].impactDamage < 0) ? 0 : this.players[hitID].life - this.players[shooterID].impactDamage
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
                if(hashMap[arr[j]].score > hashMap[arr[greaterScore]].kills)
                    greaterScore = j
                
            }
            let temp = arr[i]
            arr[i] = arr[greaterScore]
            arr[greaterScore] = temp

            newArr.push({
                id: arr[i],
                name: hashMap[arr[i]].playerName,
                score: hashMap[arr[i]].kills
            })
        }

        return newArr
    }

    /**
     *  ==============================
     *              GETTERS
     *  ==============================
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

     /* return every socket's id in the room */
     getIds(){
        return Object.keys(this.players)
    }

}

module.exports = FreeforAll