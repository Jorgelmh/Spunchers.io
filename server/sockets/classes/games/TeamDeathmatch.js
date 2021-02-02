/* Import supper class for game modes -> abstract logic */
const Game = require('./Game')

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
        this.blueTeam = {}
        this.redTeam = {}

        /* Bullet arrays of every team */
        this.bulletsBlueTeam = []
        this.bulletsRedTeam = []

        /* Team scores */
        this.scores = {
            blueTeam: 0,
            redTeam: 0
        }

        /* Gamemode-code */
        this.gameCode = 1
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

        if(this.bulletsBlueTeam.length > 0)
            this.updateBulletsPosition(dt, this.redTeam, this.bulletsBlueTeam)  
        
        if(this.bulletsRedTeam.length > 0)
            this.updateBulletsPosition(dt, this.blueTeam, this.bulletsRedTeam)

        /* return only the info the user needs to know about the players */
        let clientPlayers = [this.serializePlayers(this.blueTeam), this.serializePlayers(this.redTeam)]

        /* Check bonus position */
        let bonusKits = this.checkBonusKits()

        return {
            players: clientPlayers,
            bullets: [...this.bulletsBlueTeam, ...this.bulletsRedTeam],
            serverTime: Date.now(),
            bonusKits
        }
    }

    /* Remove players when disconected */
    removePlayer(playerID){

        /* Delete depending on their team */
        if(this.blueTeam[playerID]){
            delete this.blueTeam[playerID]

            /* Delete bullets from the disconnected user */
            this.bulletsBlueTeam = this.bulletsBlueTeam.filter((bullet) => bullet.ownerID !== playerID)
        }
        else{
            delete this.redTeam[playerID]

            /* Delete bullets from the disconnected user */
            this.bulletsRedTeam = this.bulletsRedTeam.filter((bullet) => bullet.ownerID !== playerID)
        }

        if(Object.keys(this.blueTeam).length === 0 && Object.keys(this.redTeam).length === 0)
            this.scores = {blueTeam: 0, redTeam: 0}

        /* If the room is empty flush the chat */
        if(Object.keys(this.blueTeam).length + Object.keys(this.redTeam).length === 0) this.onlineChat.messages = []

        /* notify the rest of the players that someone has abandoned the lobby */
        this.socketIO.to(this.roomname).emit('load team members', this.getPlayers())

    }


    /* Decide team for new player */
    selectTeam(data, socketID){
        if(data.game.team)
            this.addPlayers(data, socketID, this.redTeam)
        else
            this.addPlayers(data, socketID, this.blueTeam)
    }

    /* Prepare new player -> set data and socket to other players */
    prepareNewPlayer(socketID){
        let skins, ids

        skins = this.getSkins(socketID)

        /* set ids of players currently in the room*/
        ids = this.getIds()

        this.socketIO.to(this.roomname).emit('load team members', this.getPlayers())

        return [skins,
            ids]
            
    }

    /* Reduce life of a hit player */
    reduceLife(hitID, shooterID){
        let hitPlayer = this.blueTeam[hitID] || this.redTeam[hitID]
        let shooterPlayer = this.blueTeam[shooterID] || this.redTeam[shooterID]

        hitPlayer.lastHit = Date.now()

        return (hitPlayer.life - shooterPlayer.impactDamage < 0) ? 0 : hitPlayer.life - shooterPlayer.impactDamage

    }

    /* Set score, increase the teams score */
    setScore(playerID){
        let player = this.blueTeam[playerID] || this.redTeam[playerID]
        player.kills ++

        /* Increment team's score */
        if(this.blueTeam[playerID])
            this.scores.blueTeam ++
        else
            this.scores.redTeam ++

    }

    /** 
     *  ==================================================
     *      Functions to be called when a Player dies
     *  ==================================================
    */

   playerHasDied(playerID){

        let currentPlayer = this.blueTeam[playerID] || this.redTeam[playerID]
        /* Sync check time */
        currentPlayer.lastDeath = Date.now()
        currentPlayer.deaths ++

        /* Reload user's weapon when died */
        currentPlayer.bulletsCharger = currentPlayer.ammunition
        this.emitReload(playerID)
    
        let newPosition = this.respawnPlayerPosition()

        /* Remove bullets when a player dies */
        if(this.blueTeam[playerID])
            this.bulletsBlueTeam = this.bulletsBlueTeam.filter((elem) => elem.ownerID !== playerID)
        else
            this.bulletsRedTeam = this.bulletsRedTeam.filter((elem) => elem.ownerID !== playerID)


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
    if(this.gameCode === 1)
        this.socketIO.to(this.roomname).emit('New teams leaderboard', this.scores)
        
}

    /**
     *  ==============================
     *              GETTERS
     *  ==============================
     */

    /* Return non-repeated values of skins */
    getSkins(playerID){
        let srcArray = []

        for(let playerID in this.blueTeam){
            if(srcArray.indexOf(this.blueTeam[playerID].skin))
                srcArray.push(this.blueTeam[playerID].skin)
        }

        for(let playerID in this.redTeam){
            if(srcArray.indexOf(this.redTeam[playerID].skin))
                srcArray.push(this.redTeam[playerID].skin)
        }

        /* Player object */
        let player = this.blueTeam[playerID] || this.redTeam[playerID]

        return {
            srcArray,
            characterInfo: {
                bullets: player.ammunition,
                shootingDelay: player.shootingDelay
            }
        }
    }

    /* return players for the pre-lobby screen */
    getPlayers(){
        return {
            blues: Object.values(this.blueTeam).map(player => {
                return {
                    name: player.playerName,
                    skin: player.skin
                }
            }),
            reds: Object.values(this.redTeam).map(player => {
                return {
                    name: player.playerName,
                    skin: player.skin
                }
            })
        }
    }

    /* return every socket's id in the room */
    getIds(){
        return [...Object.keys(this.blueTeam), ...Object.keys(this.redTeam)]
    }
}

module.exports = TeamDeathmatch