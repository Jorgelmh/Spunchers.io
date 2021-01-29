/**
 *  ===========================
 *     MANAGE GAME STATE
 *  ===========================
 */

class State {
    constructor(){

        /* Delay behind server time */
        this.RENDER_DELAY = 100

        /* buffer to push new packet states */
        this.buffer = []

        /* game starting point in time */
        this.gameStart = 0

        /* First server time stamp */
        this.firstServerTimestamp = 0

    }

    /**
     *  ===================================
     *      PUSH A NEW SERVER STATE
     *  ===================================
     */

    processGameUpdate(update) {
        if (!this.firstServerTimestamp) {
            this.firstServerTimestamp = update.serverTime;
            this.gameStart = Date.now();
        }
        this.buffer.push(update);
            
        // Keep only one game update before the current server time
        const base = this.getBaseUpdate();
        if (base > 0) {
            this.buffer.splice(0, base);
        }
    }

    getBaseUpdate() {
        const serverTime = this.currentServerTime();
        for (let i = this.buffer.length - 1; i >= 0; i--) {
          if (this.buffer[i].serverTime <= serverTime) {
            return i;
          }
        }
        return -1;
    }

    /* get current time of the state in the server */
    currentServerTime() {
        return this.firstServerTimestamp + (Date.now() - this.gameStart) - this.RENDER_DELAY;
    }

    getCurrentState() {
        if (!this.firstServerTimestamp) {
          return {};
        }
      
        const base = this.getBaseUpdate();
      
        // If base is the most recent update we have, use its state.
        // Otherwise, interpolate between its state and the state of (base + 1).
        if (base < 0 || base === this.buffer.length - 1) {
            return this.buffer[this.buffer.length - 1];
        } else {
            const baseUpdate = this.buffer[base];

            return baseUpdate;
        }
      }

    
}
export default State