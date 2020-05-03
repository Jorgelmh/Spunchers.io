/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const Game = require('./classes/Game')
const map = require('./maps/test.json')

/* Scoket listener */
const socketListen = (app) => {

    const io = socketIO(app, {pingInterval: 1000})

    //Lobby of the currrent game
    const serverGame = new Game(map.tileMap, map.colissionMap, map.dimensions.width, map.dimensions.height, map.tileSet, io)
    
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

            /* load previous players' skins */
            socket.emit('Load Skins', serverGame.getSkins())

            /* Other players load tnew player's skin */
            socket.broadcast.emit('Load New Skin', {src: data.skin})
            io.sockets.emit('state', serverGame.update())

            /* Send the score */
            io.sockets.emit('New leaderboard', serverGame.sortScores(serverGame.players))

        })

        /* Listener of socket movement */
        socket.on('movement', (data) => {
            serverGame.onMovement(data)
            io.sockets.emit('state', serverGame.update())
        } )

        socket.on('disconnect', (data) => {
            serverGame.removePlayer(socket.id) 
            if(Object.keys(serverGame.players).length === 0) serverGame.onlineChat.messages = []
            io.sockets.emit('state', serverGame.update())  
            io.sockets.emit('New leaderboard', serverGame.sortScores(serverGame.players))
              
        })

        /* Listener of players shooting */
        socket.on('shoot',(data) => {
            
            serverGame.addBullet(socket.id)

            if(shootingInterval === null){
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