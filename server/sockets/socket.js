/**
 * ===========================
 *       Websocket logic
 * ===========================
 */
const socketIO = require('socket.io')
//const lobby = new Lobby() //Class that will store all the values of players in it

const socketListen = (app) => {
    const io = socketIO(app)
    
    io.on('connection', function(socket) {

        /* Add websockets in here */
        socket.emit('welcome', 'Work please')
        console.log(socket.id) //This is a unique id that will be used to store players
    });
}

module.exports.listen = socketListen