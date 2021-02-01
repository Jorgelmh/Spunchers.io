/**
 *  ===========================
 *     MANAGE GAME STATE
 *  ===========================
 */

class State {
    constructor(){

        /* Delay behind server time */
        this.RENDER_DELAY = 50

        /* buffer to push new packet states */
        this.buffer = []

        /* game starting point in time */
        this.gameStart = 0

        /* First server time stamp */
        this.firstServerTimestamp = 0

        /* current state */
        this.state = null

    }

    /**
     *  ===================================
     *      PUSH A NEW SERVER STATE
     *  ===================================
     */

    processGameUpdate(update) {
        if (!this.firstServerTimestamp) {
            this.firstServerTimestamp = update.serverTime
            this.gameStart = Date.now()
        }
        this.buffer.push(update);
            
        // Keep only one game update before the current server time
        const base = this.getBaseUpdate()
        if (base > 0) {
            this.buffer.splice(0, base)
        }
    }

    getBaseUpdate() {
        let serverTime = this.currentServerTime()

        for (let i = this.buffer.length - 1; i >= 0; i--) {
          if (this.buffer[i].serverTime <= serverTime) {
            return i
          }
        }
        return -1
    }

    /* get current time of the state in the server */
    currentServerTime() {

        const now = Date.now()
        let serverTime = this.firstServerTimestamp + (now - this.gameStart)

        /* If the client goes ahead of the server, then reduce some delay and add a controlled amount */
        let delay = now - serverTime
        if(delay > 0){
            serverTime += delay
            serverTime-=this.RENDER_DELAY*3
        }else{
            serverTime-=this.RENDER_DELAY
        }

        return  serverTime
    }

    getCurrentState(){
        if (!this.firstServerTimestamp) {
          return {};
        }
      
        const base = this.getBaseUpdate()
        const serverTime = this.currentServerTime() 
      
        // If base is the most recent update we have, use its state.
        // Otherwise, interpolate between its state and the state of (base + 1).
        if (base < 0 || base === this.buffer.length - 1) {
            return this.buffer[this.buffer.length - 1];

        } else {
            const baseUpdate = this.buffer[base]
            this.state = baseUpdate
            const next = this.buffer[base+1]
            const ratio = (serverTime - baseUpdate.serverTime) / (next.serverTime - baseUpdate.serverTime)

            /* If a team lobby then interpolate each team individually */
            if(Array.isArray(baseUpdate.players)){

                let interpolatedState = {
                    players: [
                        this.interpolatePlayers(baseUpdate.players[0], next.players[0], ratio),
                        this.interpolatePlayers(baseUpdate.players[1], next.players[1], ratio)    
                    ],
                    bullets: this.interpolateBullets(baseUpdate.bullets, next.bullets, ratio),
                    bonusKits: baseUpdate.bonusKits
                }

                if(baseUpdate.flags){

                    /* Interpolate each flag */
                    interpolatedState.flags = baseUpdate.flags

                    let interpolatedBlue = this.interpolatePosition({posX: baseUpdate.flags[0].pos.x, posY: baseUpdate.flags[0].pos.y}, {posX: next.flags[0].pos.x, posY: next.flags[0].pos.y}, ratio)
                    let interpolatedRed = this.interpolatePosition({posX: baseUpdate.flags[1].pos.x, posY: baseUpdate.flags[1].pos.y}, {posX: next.flags[1].pos.x, posY: next.flags[1].pos.y}, ratio)

                    interpolatedState.flags[0].pos = interpolatedBlue
                    interpolatedState.flags[1].pos = interpolatedRed

                }

                return interpolatedState

            }else{

                return{
                    players: this.interpolatePlayers(baseUpdate.players, next.players, ratio),
                    bullets: this.interpolateBullets(baseUpdate.bullets, next.bullets, ratio),
                    bonusKits: baseUpdate.bonusKits
                }

            }            
        }
    }

      /**
       *    ========================
       *         INTERPOLATION
       *    ========================
       */
    /* Interpolate position between packets */
    interpolatePlayers(base, next, ratio){

        /* Interpolated state */
        let interpolated = {}

        Object.entries(base).map(([id, player]) => {

            /* In order to interpolate the next packet from server must've been received*/
            if(next[id]){

                /* Position calculated between packets */
                let interpolatedPosition = this.interpolatePosition(base[id], next[id], ratio)

                player.posX = interpolatedPosition.x
                player.posY = interpolatedPosition.y

                interpolated[id] = player

            }
        })

        return interpolated
    }

    /* Interpolate bullets */
    interpolateBullets(base, next, ratio){

        /* Loop through the bullet's array and inteprolate each entry's position */
        return base.map((bullet) => {

            let owner = this.state.players[bullet.ownerID] || this.state.players[0][bullet.ownerID] || this.state.players[1][bullet.ownerID]

            if(owner.skin !== 'mikaela'){
                let futureBullet = next.find((nextBullet) => nextBullet.timeStamp === bullet.timeStamp && nextBullet.ownerID === bullet.ownerID)

                if(futureBullet){
                    let interpolatedPosition = this.interpolatePosition(bullet, futureBullet, ratio)

                    bullet.posX = interpolatedPosition.x
                    bullet.posY = interpolatedPosition.y
                }
            }
            return bullet
        })
    }

    /* Interpolate single values */
    interpolatePosition(current, next, ratio){
        return {
            x: current.posX + (next.posX - current.posX) * ratio,
            y: current.posY + (next.posY - current.posY) * ratio
        }
    }
    
}
export default State