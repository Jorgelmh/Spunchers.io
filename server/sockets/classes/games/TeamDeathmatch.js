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
        this.team1 = {}
        this.team2 = {}

        /* Bullet arrays of every team */
        this.bulletsTeam1 = []
        this.bulletsTeam2 = []

        /* Team scores */
        this.scores = {
            team1: 0,
            team2: 0
        }
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
        let clientPlayers = [this.serializePlayers(this.team1), this.serializePlayers(this.team2)]

        /* Check bonus position */
        let bonusKits = this.checkBonusKits()

        return {
            players: clientPlayers,
            bullets: [...this.bulletsTeam1, ...this.bulletsTeam2],
            serverTime: Date.now(),
            bonusKits
        }
    }

    /* Remove players when disconected */
    removePlayer(playerID){

        /* Delete depending on their team */
        if(this.team1[playerID])
            delete this.team1[playerID]
        
        else
            delete this.team2[playerID]

        if(Object.keys(this.team1).length === 0 && Object.keys(this.team2).length === 0)
            this.scores = {team1: 0, team2: 0}

    }

    /* Reduce life of a hit player */
    reduceLife(hitID, shooterID){
        let hitPlayer = this.team1[hitID] || this.team2[hitID]
        let shooterPlayer = this.team1[shooterID] || this.team2[shooterID]

        hitPlayer.lastHit = Date.now()

        return (hitPlayer.life - shooterPlayer.impactDamage < 0) ? 0 : hitPlayer.life - shooterPlayer.impactDamage

    }

    /* Set score, increase the teams score */
    setScore(playerID){
        let player = this.team1[playerID] || this.team2[playerID]
        player.score ++

        /* Increment team's score */
        if(this.team1[playerID])
            this.scores.team1 ++
        else
            this.scores.team2 ++

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

    /* return players for the pre-lobby screen */
    getPlayers(){
        return {
            blues: Object.values(this.team1).map(player => {
                return {
                    name: player.playerName,
                    skin: player.skin
                }
            }),
            reds: Object.values(this.team2).map(player => {
                return {
                    name: player.playerName,
                    skin: player.skin
                }
            })
        }
    }

    /* return every socket's id in the room */
    getIds(){
        return [...Object.keys(this.team1), ...Object.keys(this.team2)]
    }
}

module.exports = TeamDeathmatch