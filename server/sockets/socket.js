/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const {generateRandomMap, colissionsTest, colissionable} = require('./test')
//const lobby = new Lobby() //Class that will store all the values of players in it

//It will be a class soon
let players = []

const socketListen = (app) => {
    const io = socketIO(app)
    
    io.on('connection', function(socket) {

        setInterval(() => {
            socket.emit('state', players)
        }, 1000 / 60)

        /* Add websockets in here */
        socket.emit('loadMap', {
            map: generateRandomMap(16, 9),
            colissionMatrix: colissionsTest(16, 9, colissionable),
            tileSet: 'tileSet',
            playerID: socket.id,
            server: {
                width: 1280,
                height: 720
            }
        })

        socket.on('New Player', (data) => {
            players.push({
                playerId: socket.id,
                posX: 0,
                posY: 0
            })
        })

        /* Listener of socket movement */
        socket.on('movement', (data) => {

            if(data.controls.goUp) 
                players.find((element) => element.playerId === data.id).posY --

            if(data.controls.goDown)
                players.find((element) => element.playerId === data.id).posY ++

            if(data.controls.goLeft)
                players.find((element) => element.playerId === data.id).posX --

            if(data.controls.goRight)
                players.find((element) => element.playerId === data.id).posX ++
        })
        
        socket.on('disconnect', () => {
            let index = players.findIndex((element) => element.playerId == socket.id)
            players.splice(index, 1)
        })
    });
}

module.exports.listen = socketListen