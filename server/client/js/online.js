import Online from '../js/classes/Online.js'
import Glide from '@glidejs/glide'
/**
 *  ============================
 *      Multiplayer TILE Game
 *  ============================
 */
const socket = io()
let game

/* Skins on the server that are ready to use */
const characterSkins = ['blade', 'mikaela', 'rider']

/* Glide track -> where the slides have to be added in */
const track = document.getElementsByClassName('glide__slides')[0]

let loadedImg = 0
let glide

/* Adding elements to the glide carousel */
characterSkins.map((skin) => {
    let divHTML = document.createElement('div')
    divHTML.classList = "glide__slide single-character-skin"

    let name = document.createElement('h1')
    name.innerHTML = skin
    name.className = 'character-name'

    let imgHTML = document.createElement('img')
    imgHTML.src = `../assets/selectCharacters/${skin}.png`
    imgHTML.onload = () => {

        /* When the last image is loaded, then the glide object can be created => Important */
        if(++loadedImg >= characterSkins.length){
            glide = new Glide('.glide', {
                startAt: 0,
                perView: 1
              }).mount()
        }

    }

    /* Append the elements */
    divHTML.append(name)
    divHTML.append(imgHTML)
    track.append(divHTML)
})

/* Creating the Glide object to show the available skins */
const play = document.getElementById('play')
play.onclick = (event) => {
    let body =document.getElementsByTagName('body')[0]
    body.classList.remove('background-connect-frame')

    let name = document.getElementById('playerName').value || 'unnamed'

    document.getElementById('site-game').style.display = 'block'
    body.removeChild(document.getElementById('login-frame'))
    const engine = new Online(game.lobby.map, game.lobby.collisionMatrix ,game.lobby.tileSet , document.getElementById('game'), socket, game.playerID, game.lobby.server, characterSkins[glide.index], name)
}


socket.on('loadMap', (data) => {
    game = data
})
 