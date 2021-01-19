/* Import supper class for game modes -> abstract logic */
const Game = require('./Game')

/* Import character classes */
const Mikaela = require('../characters/Mikaela.js')
const Blade = require('../characters/Blade.js')
const Rider = require('../characters/Rider.js')
const Lisa = require('../characters/Lisa.js')
const Ezrael = require('../characters/Ezrael')
const Sydnie = require('../characters/Sydnie')

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
        let clientPlayers = Object.fromEntries(Object.entries(this.players).map(([id, player]) => {

            if(Date.now() - player.lastUpdate >= this.interpolationDelay && player.lastUpdate !== 0)
                this.calculateMovement(id, player.dequeueState())

            /* Death animation */
            if(this.players[id].life === 0 && Date.now() - this.players[id].lastDeath >= 300 && this.players[id].character.currentSprite.x === 0)
                this.players[id].character.currentSprite.x ++

            return [id, player.playerState()]
        }))

        return {
            players: clientPlayers,
            bullets: this.bullets,
            serverTime: Date.now()
        }

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
                break
            case 'lisa':
                this.players[socketID] = new Lisa(600, 200, data.character, data.name)
                break
            case 'ezrael':
                this.players[socketID] = new Ezrael(600, 200, data.character, data.name)
                break
            case 'sydnie':
                this.players[socketID] = new Sydnie(600, 200, data.character, data.name)
                break
        }
    }

    /* Remove Player ->  recieves the socket id as the parameter */

    removePlayer = (id) => {
        delete this.players[id]  
    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

   playerHasDied(playerID){

        /* Sync check time */
        this.players[playerID].lastDeath = Date.now()

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
        this.socketIO.sockets.emit('New leaderboard', this.sortScores(this.players))
            
    }

    /* Change score of a player */
    setScore(playerID){
        this.players[playerID].score ++
    }

    /* Reduce life of a hit player */
    reduceLife(hitID, shooterID){
        return (this.players[hitID].life - this.players[shooterID].impactDamage < 0) ? 0 : this.players[hitID].life - this.players[shooterID].impactDamage
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

}

module.exports = FreeforAll