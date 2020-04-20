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
        [1,1,1,1,16,20,18,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,16,20,18,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,16,20,18,1,1,1,1,1,1,1,1,1],
        [1,1,1,11,21,22,23,1,1,1,1,1,1,1,1,1],
        [1,1,1,16,20,18,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,16,20,18,1,1,1,1,1,1,1,1,1,1],
        [1,1,11,21,22,23,1,1,1,1,1,1,1,1,1,1],
        [1,1,16,20,18,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,16,20,18,1,1,1,1,1,1,1,1,1,1,1],
    ],
    colissionMatrix: [
        [7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [10,9,0,0,0,0,0,0,0,0,26,25,25,27,0,0],
        [0,0,0,0,0,0,0,0,0,0,24,0,30,24,0,0],
        [0,0,0,0,0,0,0,0,0,0,24,0,3,24,4,0],
        [0,0,0,0,0,0,0,0,0,0,24,0,30,24,0,0],
        [0,0,0,0,0,0,0,0,0,0,29,0,25,28,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,5,6,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,31,35,35],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,34,33,33]
    ],
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
                posX: 600,
                posY: 400,
                character: null,
                skin: data.skin,
                playerName: data.name
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

            if(currentPlayer){
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
            if(index >= 0)
                players.splice(index, 1)                     
        })
    });

}

module.exports.listen = socketListen