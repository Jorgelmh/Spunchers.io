/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const { generateRandomMap, colissionsTest, colissionable } = require('./test')
const Game = require('./classes/Game')
const map = require('./maps/test.json')
//const lobby = new Lobby() //Class that will store all the values of players in it

/* Scoket listener */
const socketListen = (app) => {
    const io = socketIO(app, {pingInterval: 1000})
    const serverGame = new Game(map.tileMap, map.colissionMap, map.dimensions.width, map.dimensions.height, map.tileSet)
    
    io.sockets.on('connection', function (socket) {
        socket.on('ping', function() {
          socket.emit('pong');
        });
    });

    io.on('connection', function(socket) {

        setInterval(() => {
            serverGame.update()
            //socket.emit('state', serverGame.getState())
            io.sockets.emit('state', serverGame.getState())
        }, 1000 / 60)

        /* Add websockets in here */
        socket.emit('loadMap', serverGame.onLoadMap(socket.id))

        /* When a new player enters the lobby => Note: Validations on repetitions are in the client version of the game*/
        socket.on('New Player', (data) => {
            serverGame.addPlayers(data, socket.id)

            /* load previous players' skins */
            socket.emit('Load Skins', serverGame.getSkins())

            /* Other players load tnew player's skin */
            socket.broadcast.emit('Load New Skin', {src: data.skin})
        })

        /* Listener of socket movement */
        socket.on('movement', serverGame.onMovement)

        socket.on('disconnect', (data) => {
            serverGame.removePlayer(socket.id)                 
        })

        /* Listener of players shooting */
        socket.on('shoot',(data) => {
            serverGame.addBullet(data, socket.id)
        })

    });

}

module.exports.listen = socketListen