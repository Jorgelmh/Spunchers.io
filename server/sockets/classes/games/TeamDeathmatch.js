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
 *          TEAM DEATHMATCH
 *  =============================
 */

class TeamDeathmatch extends Game{
    constructor(map, io){
        super(map, io)

        /* Room name */
        this.roomname = 'teamdeathmatch'

        /* Hash map of players of every team */
        this.team1 = {}
        this.team2 = {}

        /* Bullet arrays of every team */
        this.bulletsTeam1 = []
        this.bulletsTeam2 = []
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

        if(this.bulletsTeam1.length > 0)
            this.updateBulletsPosition(dt, this.team2, this.bulletsTeam1)  
        
        if(this.bulletsTeam2.length > 0)
            this.updateBulletsPosition(dt, this.team1, this.bulletsTeam2)

        /* return only the info the user needs to know about the players */
        let clientPlayers = [this.getPlayers(this.team1), this.getPlayers(this.team2)]

        return {
            players: clientPlayers,
            bullets: [...this.bulletsTeam1, ...this.bulletsTeam2],
            serverTime: Date.now()
        }
    }

    getPlayers(players){
        return Object.fromEntries(Object.entries(players).map(([id, player]) => {

            if(Date.now() - player.lastUpdate >= this.interpolationDelay && player.lastUpdate !== 0)
                this.calculateMovement(player, player.dequeueState())

            /* Death animation */
            if(players[id].life === 0 && Date.now() - players[id].lastDeath >= 300 && players[id].character.currentSprite.x === 0)
                players[id].character.currentSprite.x ++

            return [id, player.playerState()]
        }))
    }

    /* Add players */
    addPlayers(data, socketID, team){

        switch (data.skin) {
            case 'blade':
                if(team)
                    this.team1[socketID] = new Blade(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Blade(600, 200, data.character, data.name)
                break
            case 'mikaela':
                if(team)
                    this.team1[socketID] = new Mikaela(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Mikaela(600, 200, data.character, data.name)
                break
            case 'rider':
                if(team)
                    this.team1[socketID] = new Rider(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Rider(600, 200, data.character, data.name)
                break
            case 'lisa':
                if(team)
                    this.team1[socketID] = new Lisa(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Lisa(600, 200, data.character, data.name)
                break
            case 'ezrael':
                if(team)
                    this.team1[socketID] = new Ezrael(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Ezrael(600, 200, data.character, data.name)
                break
            case 'sydnie':
                if(team)
                    this.team1[socketID] = new Sydnie(600, 200, data.character, data.name)
                else
                    this.team2[socketID] = new Sydnie(600, 200, data.character, data.name)
                break
        }
    }

    /* Remove players when disconected */
    removePlayer(playerID){

        /* Delete depending on their team */
        if(this.team1[playerID])
            delete this.team1[playerID]
        
        else
            delete this.team2[playerID]

    }

    /* Reduce life of a hit player */
    reduceLife(hitID, shooterID){
        let hitPlayer = this.team1[hitID] || this.team2[hitID]
        let shooterPlayer = this.team1[shooterID] || this.team2[shooterID]

        return (hitPlayer.life - shooterPlayer.impactDamage < 0) ? 0 : hitPlayer.life - shooterPlayer.impactDamage

    }

    /* Set score, increase the teams score */
    setScore(playerID){
        let player = this.team1[playerID] || this.team2[playerID]
        player.score ++

    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

   playerHasDied(playerID){

        let currentPlayer = this.team1[playerID] || this.team2[playerID]
        /* Sync check time */
        currentPlayer.lastDeath = Date.now()

        /* Reload user's weapon when died */
        currentPlayer.bulletsCharger = currentPlayer.ammunition
        this.emitReload(playerID)
    
        let newPosition = this.respawnPlayerPosition()

        /* Remove bullets when a player dies */
        if(this.team1[playerID])
            this.bulletsTeam1 = this.bulletsTeam1.filter((elem) => elem.ownerID !== playerID)
        else
            this.bulletsTeam2 = this.bulletsTeam2.filter((elem) => elem.ownerID !== playerID)


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
    //this.socketIO.sockets.emit('New leaderboard', this.sortScores(this.players))
        
}

    /**
     *  ==============================
     *              GETTERS
     *  ==============================
     */

    /* Return non-repeated values of skins */
    getSkins(playerID){
        let srcArray = []

        for(let playerID in this.team1){
            if(srcArray.indexOf(this.team1[playerID].skin))
                srcArray.push(this.team1[playerID].skin)
        }

        for(let playerID in this.team2){
            if(srcArray.indexOf(this.team2[playerID].skin))
                srcArray.push(this.team2[playerID].skin)
        }

        /* Player object */
        let player = this.team1[playerID] || this.team2[playerID]

        return {
            srcArray,
            characterInfo: {
                bullets: player.ammunition,
                shootingDelay: player.shootingDelay
            }
        }
    }
}

module.exports = TeamDeathmatch