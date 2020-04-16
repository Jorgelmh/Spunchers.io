import Online from '../js/classes/Online.js'

/**
 *  ============================
 *      Multiplayer TILE Game
 *  ============================
 */
const socket = io()

socket.on('loadMap', (data) => {
    const game = new Online(data.lobby.map, data.lobby.colissionMatrix, data.lobby.tileSet , document.getElementById('game'), socket, data.playerID, data.lobby.server)
})
 