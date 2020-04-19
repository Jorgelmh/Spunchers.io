import Online from '../js/classes/Online.js'
import Glide from '@glidejs/glide'
/**
 *  ============================
 *      Multiplayer TILE Game
 *  ============================
 */
const socket = io()
let game

const characterSkins = ['c3po', 'deadpool', 'captainamerica', 'mandalorian', 'nickfury', 'pirate', 'stormtrooper', 'tonystark']
const track = document.getElementsByClassName('glide__slides')[0]

let loadedImg = 0

characterSkins.map((skin) => {
    let divHTML = document.createElement('div')
    divHTML.classList = "glide__slide single-character-skin"

    let name = document.createElement('h1')
    name.innerHTML = skin
    name.className = 'character-name'

    let imgHTML = document.createElement('img')
    imgHTML.src = `../assets/selectCharacters/${skin}.png`
    imgHTML.onload = () => {
        if(++loadedImg >= characterSkins.length){
            const glide = new Glide('.glide', {
                startAt: 0,
                perView: 1
              }).mount()
        }

    }

    divHTML.append(name)
    divHTML.append(imgHTML)
    track.append(divHTML)
})

/* Creating the Glide object to show the available skins */


const play = document.getElementById('play')
play.onclick = (event) => {
    let body =document.getElementsByTagName('body')[0]
    body.classList.remove('background-connect-frame')

    body.removeChild(document.getElementById('login-frame'))
    const engine = new Online(game.lobby.map, game.lobby.colissionMatrix, game.lobby.tileSet , document.getElementById('game'), socket, game.playerID, game.lobby.server, characterSkins[glide.index])
}


socket.on('loadMap', (data) => {
    game = data
})
 