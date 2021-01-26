import Online from '../js/classes/Online.js'

/**
 * ==================================
 *          Team Deathmatch
 * ==================================
 */

/* Creating the Glide object to show the available skins */
const play = document.getElementById('play')

/* HTML body */
let body = document.getElementsByTagName('body')[0]

/* select team screen */
const selectTeam = document.getElementById('select-teams')

/* Start server */
const socket = io()
let game

/* Player name */
let name

/* Players in the lobby */
let players

const createEngine = (team) => {
    /* show background when a team has been selected */
    document.getElementById('background-frame').style.display = 'block'

    document.getElementById('site-ajax-loader').style.display = 'block'
    body.removeChild(selectTeam)
    const engine = new Online(game.lobby.map, game.lobby.collisionMatrix, game.lobby.shadowMap ,game.lobby.tileSet, 
                    document.getElementById('game'), socket, game.playerID, game.lobby.server, characterSkins[glide.index], name, {mode: 1, team})

}

/**
 *  =================================
 *      ADD SELECT TEAMS LISTENERS
 *  =================================
 */

 const selectRedTeam = document.getElementById('site-red-team')
 const selectBlueTeam = document.getElementById('site-blue-team')


/* Enter red team */
selectRedTeam.onclick = (e) => {
    createEngine(1)
}

/* Enter blue team */
selectBlueTeam.onclick = (e) => {
    createEngine(0)
}

/**
 *  =======================================
 *      PLAYER HAS SELECTED A CHARACTER
 *  =======================================
 */
play.onclick = () => {

    name = document.getElementById('playerName').value || 'unnamed'
    /* remove select characters frame */
    body.removeChild(document.getElementById('login-frame'))

    /* show select teams screen */
    selectTeam.style.display = 'block'

    /* hide background until a team's been selected */
    document.getElementById('background-frame').style.display = 'none'

    /* Show current players in lobby */
    displayPlayers(players.blues, document.getElementById('blue-team-players'))
    displayPlayers(players.reds, document.getElementById('red-team-players'))
}

socket.on('loadMap', (data) => {
    game = data
})

socket.on('load team members', (data) => {
    players = data
})

/* Display players on the lobby */
function displayPlayers(players, div){

    players.map(player => {
        /* External player's div */
        let divPlayer = document.createElement('div')
        divPlayer.className = "lobby-player"

        /* Playername */
        let playerName = document.createElement('p')
        playerName.innerHTML = player.name

        divPlayer.append(images.find((image) => image.src.includes(player.skin)).cloneNode())
        divPlayer.append(playerName)

        div.append(divPlayer)

    })  
     
}