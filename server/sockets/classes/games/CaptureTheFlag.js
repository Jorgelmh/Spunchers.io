/* Import supper class for game modes -> abstract logic */
const TeamDeathMatch = require('./TeamDeathmatch')

class CaptureTheFlag extends TeamDeathMatch{
    constructor(map, io){
        super(map,io)

        /* Flag positions from JSON map */
        this.flagPositions = {
            blue: map.flagPositions[0],
            red: map.flagPositions[1]
        }
        /**
         *  =======================
         *      FLAG'S STATES
         *  =======================
         */

         /* Flag States: false -> in base || true -> released (around the map) || if carrier = true -> carried by a player*/

         /* Flag of FBI team */
        this.blueFlag = {
            team: 0,
            state: false,
            pos: {
                x: this.flagPositions.blue.x,
                y: this.flagPositions.blue.y
            }
            ,
            carrier: null
        }

        /* Flag of Gambinos team */
        this.redFlag = {
            team: 1,
            state: false,
            pos: {
                x: this.flagPositions.red.x,
                y: this.flagPositions.red.y
            },
            carrier: null
        }
        /* delay */
        this.delayFlag = 2000

        /* Last picked */
        this.lastScored = {
            blue: 0,
            red: 0
        }

        /* Roomname */
        this.roomname = 'captureTheFlag'

        /* Gamemode-code */
        this.gameCode = 2

        /* Score */
        this.scoresFlag = {
            blueTeam: 0,
            redTeam: 0
        }

    }

    /**
     *  =======================
     *      UPDATE STATE
     *  =======================
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

        this.updateFlags()

        /* return flags position and state */

        return {
            players: clientPlayers,
            bullets: [...this.bulletsBlueTeam, ...this.bulletsRedTeam],
            serverTime: Date.now(),
            bonusKits,
            flags: [this.blueFlag, this.redFlag]
        }
    }

    /**
     *  ==============================
     *         FLAG COLLISION
     *  ==============================
     */
    checkFlagCollision(socketID){
        let team = (this.blueTeam[socketID]) ? 0 : 1
        let currentPlayer = this.blueTeam[socketID] || this.redTeam[socketID]

        /* Check collision of team members of team 2 with blue flag */
        if(team){

            /* If enemy flag is free to pick up -> then change carrier */
            if(currentPlayer && !this.blueFlag.carrier && this.getCollision(this.blueFlag.pos, currentPlayer)){
                this.blueFlag.carrier = socketID
                this.blueFlag.state = true
            }
            

            /* if own flag is released around the map -> return it back to base*/
            if(currentPlayer && this.redFlag.state && !this.redFlag.carrier && this.getCollision(this.redFlag.pos, currentPlayer)){
                this.redFlag.pos = {
                    x: this.flagPositions.red.x,
                    y: this.flagPositions.red.y
                }
                this.redFlag.state = false
            }

            /* If player is holding the flag and reaches the enemy flag then add point */
            if(currentPlayer && socketID === this.blueFlag.carrier && !this.redFlag.state && Date.now() - this.lastScored.red >= this.delayFlag && this.getCollision(this.redFlag.pos, currentPlayer)){
                this.scoresFlag.redTeam ++
                this.blueFlag.carrier = null
                this.lastScored.red = Date.now()
                this.blueFlag.pos = {
                    x: this.flagPositions.blue.x,
                    y: this.flagPositions.blue.y
                }

                this.redFlag.state = true
                /* Emit new leaderboard */
                this.socketIO.to(this.roomname).emit('New teams leaderboard', this.scoresFlag)
            }
                
        }else{
            /* If enemy flag is free to pick up -> then change carrier */
            if(currentPlayer && !this.redFlag.carrier && this.getCollision(this.redFlag.pos, currentPlayer)){
                this.redFlag.carrier = socketID
                this.redFlag.state = true
            }
            

            /* if own flag is released around the map -> return it back to base*/
            if(currentPlayer && this.blueFlag.state && !this.blueFlag.carrier && this.getCollision(this.blueFlag.pos, currentPlayer)){
                this.blueFlag.pos = {
                    x: this.flagPositions.blue.x,
                    y: this.flagPositions.blue.y
                }
                this.blueFlag.state = false
            }

            /* If player is holding the flag and reaches the enemy flag then add point */
            if(currentPlayer && socketID === this.redFlag.carrier && !this.blueFlag.state && Date.now() - this.lastScored.blue >= this.delayFlag  && this.getCollision(this.blueFlag.pos, currentPlayer)){
                
                this.scoresFlag.blueTeam ++
                this.redFlag.carrier = null
                this.lastScored.blue = Date.now()
                this.redFlag.pos = {
                    x: this.flagPositions.red.x,
                    y: this.flagPositions.red.y
                }
                this.redFlag.state = true
                /* Emit new leaderboard */
                this.socketIO.to(this.roomname).emit('New teams leaderboard', this.scoresFlag)
            }
            
        }
    }

    /**
     *  ========================
     *      UPDATE FLAG POS
     *  ========================
     */
    updateFlags(){

        /* Update flags position if taken */
        if(this.blueFlag.carrier){

            let player = this.redTeam[this.blueFlag.carrier]

            this.blueFlag.pos.x = player.posX - (player.character.currentSprite.flip * this.tile.width/2)
            this.blueFlag.pos.y = player.posY - this.tile.height/4
        }

        if(this.redFlag.carrier){

            let player = this.blueTeam[this.redFlag.carrier]

            this.redFlag.pos.x = player.posX - (player.character.currentSprite.flip * this.tile.width/2)
            this.redFlag.pos.y = player.posY - this.tile.height/4
        }

    }

    /**
     *  ========================
     *       PLAYER DIED
     *  ========================
     */
    playerHasDied(playerID){
        this.endCarrierDependence(playerID)
        super.playerHasDied(playerID)
    }

    /**
     *  ========================
     *      REMOVE PLAYER
     *  ========================
     */
    removePlayer(socketID){
        
        this.endCarrierDependence(socketID)
        super.removePlayer(socketID)
    }

    /* Remove carrier dependende */
    endCarrierDependence(socketID){

        if(this.blueFlag.carrier === socketID)
            this.blueFlag.carrier = null

        if(this.redFlag.carrier === socketID)
            this.redFlag.carrier = null
    }
}

module.exports = CaptureTheFlag