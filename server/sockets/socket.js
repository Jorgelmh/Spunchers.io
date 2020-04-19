/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const { generateRandomMap, colissionsTest, colissionable } = require('./test')
//const lobby = new Lobby() //Class that will store all the values of players in it

let players = []

/* Server maginitudes and common map => currently created randomly*/
const lobby = {
    map: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    colissionMatrix: colissionsTest(16, 9, colissionable),
    tileSet: 'tileSet',
    server: {
        width: 1280,
        height: 720,
        tilesX: 16,
        tilesY: 9
    },
    getTileWidth: function(){
        return this.server.width/this.server.tilesX
    },
    getTileHeight: function(){
        return this.server.height/this.server.tilesY
    }
}

const detectColissions = (player) =>{

    for(let i = 0; i < lobby.colissionMatrix.length; i++){
        for(let j = 0; j < lobby.colissionMatrix[0].length; j++){
            if(lobby.colissionMatrix[i][j] !== 0){

                /* Check if exists a colission => x_overlaps = (a.left < b.right) && (a.right > b.left) AND y_overlaps = (a.top < b.bottom) && (a.bottom > b.top) */
                if((j*lobby.getTileWidth() < player.posX + (lobby.getTileWidth()/4) + (lobby.getTileWidth()/2) && j*lobby.getTileWidth() + lobby.getTileWidth() > player.posX + (lobby.getTileWidth()/4)) 
                    && (i*lobby.getTileHeight()< player.posY + lobby.getTileHeight() && i*lobby.getTileHeight() + lobby.getTileHeight() > player.posY + 3*(lobby.getTileWidth()/4))){
                    return true
                }
            }
        }
    }
    return false
}

/* Scoket listener */
const socketListen = (app) => {
    const io = socketIO(app, {pingInterval: 1000})
    

    io.sockets.on('connection', function (socket) {
        socket.on('ping', function() {
          socket.emit('pong');
        });
    });

    io.on('connection', function(socket) {

        setInterval(() => {
            socket.emit('state', players)
        }, 1000 / 60)

        /* Add websockets in here */
        socket.emit('loadMap', {
            lobby,
            playerID: socket.id
        })

        /* When a new player enters the lobby => Note: Validations on repetitions are in the client version of the game*/
        socket.on('New Player', (data) => {
            players.push({
                playerId: socket.id,
                posX: 0,
                posY: 0,
                character: null,
                skin: data.skin
            })

            /* Get single values for the skins => non-repeated strings */
            let srcArray = []

            players.map((element) => {
                if(srcArray.indexOf(element.skin))
                    srcArray.push(element.skin)
            })

            /* load previous players' skins */
            socket.emit('Load Skins', {
                srcArray
            })

            /* Other players load tnew player's skin */
            socket.broadcast.emit('Load New Skin', {src: data.skin})
        })

        /* Listener of socket movement */
        socket.on('movement', (data) => {

            let currentPlayer = players.find((element) => element.playerId === data.id)

            if(data.character){
                currentPlayer.character = data.character

                if(data.controls.goUp){
                    let oldPosition = currentPlayer.posY
                    currentPlayer.posY --
    
                    if(detectColissions(currentPlayer)){
                        currentPlayer.posY = oldPosition
                    }
                }
    
                if(data.controls.goDown){
                    let oldPosition = currentPlayer.posY
                    currentPlayer.posY ++
    
                    if(detectColissions(currentPlayer)){
                        currentPlayer.posY = oldPosition
                    }
                }
    
                if(data.controls.goLeft){
                    let oldPosition = currentPlayer.posX
                    currentPlayer.posX --
    
                    if(detectColissions(currentPlayer)){
                        currentPlayer.posX = oldPosition
                    }
                }
                    
    
                if(data.controls.goRight){
                    let oldPosition = currentPlayer.posX
                    currentPlayer.posX ++
    
                    if(detectColissions(currentPlayer)){
                        currentPlayer.posX = oldPosition
                    }
    
                }
            }
            
        }) 

        socket.on('disconnect', () => {
            let index = players.findIndex((element) => element.playerId == socket.id)
            players.splice(index, 1)
        })
    });

}

module.exports.listen = socketListen