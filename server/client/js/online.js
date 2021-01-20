import Online from '../js/classes/Online.js'

/**
 *  ==============================
 *      Free for all TILE Game
 *  ==============================
 */

/* Creating the Glide object to show the available skins */
const play = document.getElementById('play')

/* Start server */
const socket = io()
let game

play.onclick = (event) => {

    document.getElementById('site-ajax-loader').style.display = 'block'

    let body =document.getElementsByTagName('body')[0]
    let name = document.getElementById('playerName').value || 'unnamed'

    body.removeChild(document.getElementById('login-frame'))
    const engine = new Online(game.lobby.map, game.lobby.collisionMatrix, game.lobby.shadowMap ,game.lobby.tileSet , document.getElementById('game'), socket, game.playerID, game.lobby.server, characterSkins[glide.index], name, {mode: 0})
}


socket.on('loadMap', (data) => {
    game = data
})


 