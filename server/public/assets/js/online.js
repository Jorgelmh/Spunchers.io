import Online from '../js/classes/Online.js'
import Glide from '@glidejs/glide'
/**
 *  ============================
 *      Multiplayer TILE Game
 *  ============================
 */
const socket = io()
const url = new URL(window.location)
let skin = url.searchParams.get('skin')

console.log('hello world from js')

if(!skin)
    skin = 'stormtrooper'

socket.on('loadMap', (data) => {
    const game = new Online(data.lobby.map, data.lobby.colissionMatrix, data.lobby.tileSet , document.getElementById('game'), socket, data.playerID, data.lobby.server, skin)
})
 