import Online from '../js/classes/Online.js'

/**
 *  ============================
 *      Multiplayer TILE Game
 *  ============================
 */
const socket = io()

socket.on('loadMap', (data) => {
    const game = new Online(data.map, data.colissionMatrix, data.tileSet , document.getElementById('game'), socket, data.playerID, data.server)
})
 