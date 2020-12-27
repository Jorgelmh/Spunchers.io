/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const Game = require('./classes/Game')
const map = require('./maps/castle.json')

/* Scoket listener */
const socketListen = (app) => {

    const io = socketIO(app, {pingInterval: 1000})

    //Lobby of the currrent game
    const serverGame = new Game(map, io)
    
    let shootingInterval = null

    /**
     * ====================================
     *      Socket Listeners (Logic)
     * ====================================
     */
    
    // Emit the latency
    io.sockets.on('connection', function (socket) {
        socket.on('ping', function() {
            socket.emit('pong');
        });
    });

    io.on('connection', function(socket) {

        /* Add websockets in here */
        socket.emit('loadMap', serverGame.onLoadMap(socket.id))

        /* When a new player enters the lobby => Note: Validations on repetitions are in the client version of the game*/
        socket.on('New Player', (data) => {
            serverGame.addPlayers(data, socket.id)

            /* load previous players' skins and send ammunition for the character selected */
            socket.emit('Load Skins and ammunition', serverGame.getSkins(socket.id))

            /* Other players load tnew player's skin */
            socket.broadcast.emit('Load New Skin', {src: data.skin})

            if(serverGame.bullets.length === 0)
                io.sockets.emit('state', serverGame.update())

            /* Send the score */
            io.sockets.emit('New leaderboard', serverGame.sortScores(serverGame.players))

        })

        /* Listener of socket movement */
        socket.on('movement', (data) => {
            serverGame.onMovement(socket.id, data)
            if(serverGame.bullets.length === 0)
                io.sockets.emit('state', serverGame.update())
        } )

        socket.on('disconnect', (data) => {
            serverGame.removePlayer(socket.id) 
            if(Object.keys(serverGame.players).length === 0) serverGame.onlineChat.messages = []
            if(serverGame.bullets.length === 0)
                io.sockets.emit('state', serverGame.update())  
            io.sockets.emit('New leaderboard', serverGame.sortScores(serverGame.players))
              
        })

        socket.on('reload weapon', (data) => {
            serverGame.reloadPlayerWeapon(socket.id)
        })

        /* Listener of players shooting */
        socket.on('shoot',(data) => {

            if(data.shootTime > serverGame.players[socket.id].lastDeath && serverGame.players[socket.id].life > 0 
                && serverGame.players[socket.id].ableToShoot && serverGame.players[socket.id].bulletsCharger > 0)
                serverGame.addBullet(socket.id, data.bullet)

            if(shootingInterval === null && serverGame.bullets.length > 0 ){
                io.sockets.emit('state', serverGame.update(Date.now()))
                shootingInterval = setInterval(() => {

                    io.sockets.emit('state', serverGame.update())

                    if(serverGame.bullets.length === 0){
                        clearInterval(shootingInterval)
                        shootingInterval = null
                    }
                }, 1000 / 60)
            }
            
        })

        /** 
         * ========================
         *      Chat Listeners
         * ========================
        */

        socket.on('Chat Message', (data) => {
            let name = serverGame.addChatMessage(data.text, socket, data.adminID)

            if(name)
                io.sockets.emit('new Chat Message', {name, text: data.text})
        })

    })

}

module.exports.listen = socketListen