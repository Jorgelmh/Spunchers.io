/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const FreeforAll = require('./classes/games/FreeforAll')
const TeamDeathmatch = require('./classes/games/TeamDeathmatch')
const map = require('./maps/castle.json')

/* Scoket listener */
const socketListen = (app) => {

    const io = socketIO(app, {pingInterval: 1000})

    //Lobby for freeforall game
    const freeforall = new FreeforAll(map, io)
    
    /* Lobby for team deathmatch game */
    const teamDeathmatch = new TeamDeathmatch(map, io)
    
    /**
     * ====================================
     *      Socket Listeners (Logic)
     * ====================================
     */
    
    // Emit the latency
    io.sockets.on('connection', function (socket) {
        socket.on('ping', function() {
            socket.emit('pong');
        });
    });

    io.on('connection', function(socket) {        

        let socketAddress = socket.handshake.headers.referer
        let gamemode = socketAddress.split('/')[3]

        /* return map for each game lobby*/
        if(gamemode === 'online'){
            socket.emit('loadMap', freeforall.onLoadMap(socket.id))
            socket.join(freeforall.roomname)
        }

        else if(gamemode === 'teams'){
            socket.emit('loadMap', teamDeathmatch.onLoadMap(socket.id))
            socket.join(teamDeathmatch.roomname)
            socket.emit('load team members', teamDeathmatch.getPlayers())
        }

        /* When a new player enters the lobby => Note: Validations on repetitions are in the client version of the game*/
        socket.on('New Player', (data) => {

            /* Skins needed to be loaded on the engine */
            let skins
            let roomname
            let ids

            /* 0 -> Free for all */
            if(data.game.mode === 0){
                freeforall.addPlayers(data, socket.id)
                skins = freeforall.getSkins(socket.id)

                /* set roomname */
                roomname = freeforall.roomname

                /* Set ids of players currently in the room */
                ids = freeforall.getIds()

                /* Send scores */
                io.to(roomname).emit('New leaderboard', freeforall.sortScores(freeforall.players))
            }

            /* 1 -> Team deathmatch */
            else if(data.game.mode === 1){

                if(data.game.team)
                    teamDeathmatch.addPlayers(data, socket.id, teamDeathmatch.team2)
                else
                    teamDeathmatch.addPlayers(data, socket.id, teamDeathmatch.team1)
        
                skins = teamDeathmatch.getSkins(socket.id)
                /* set roomname */
                roomname = teamDeathmatch.roomname

                /* set ids of players currently in the room*/
                ids= teamDeathmatch.getIds()

                /* Send scores */
                socket.emit('New teams leaderboard', teamDeathmatch.scores)
               
            }

            /* Other players load new player's skin */
            socket.to(roomname).emit('Load New Skin', {src: data.skin, id: socket.id})

            /* load previous players' skins and send ammunition for the character selected */
            socket.emit('Load Skins, ammunition and sounds', {skins, ids})

        })

        /* Listener of socket movement */
        socket.on('movement', (data) => {

            /* Change position */
            if(gamemode === 'online')
                freeforall.onMovement(freeforall.players[socket.id], data, socket.id)

            else if(gamemode === 'teams')
                teamDeathmatch.onMovement(teamDeathmatch.team1[socket.id] || teamDeathmatch.team2[socket.id], data, socket.id)
            
        })

        socket.on('disconnect', (data) => {

            if(gamemode === 'online'){
                freeforall.removePlayer(socket.id) 
                if(Object.keys(freeforall.players).length === 0) freeforall.onlineChat.messages = []
                io.to(freeforall.roomname).emit('New leaderboard', freeforall.sortScores(freeforall.players))
                socket.to(freeforall.roomname).emit('Player Disconnected', socket.id)

            }else if(gamemode === 'teams'){
                teamDeathmatch.removePlayer(socket.id)
                if(Object.keys(teamDeathmatch.team1).length + Object.keys(teamDeathmatch.team2).length === 0) teamDeathmatch.onlineChat.messages = []
                socket.to(teamDeathmatch.roomname).emit('Player Disconnected', socket.id)

            }
        })

        socket.on('reload weapon', (data) => {
            if(gamemode === 'online')
                freeforall.reloadPlayerWeapon(freeforall.players[socket.id])
            else if(gamemode === 'teams')
                teamDeathmatch.reloadPlayerWeapon(teamDeathmatch.team1[socket.id] || teamDeathmatch.team2[socket.id])
        })

        /* Listener of players shooting */
        socket.on('shoot',(data) => {

            /* Call functions and send bullet's details and id of the player */
            if(gamemode === 'online')
                freeforall.addBullet(freeforall.players[socket.id], data.bullet, data.shootTime, socket.id)
            else if(gamemode === 'teams'){
                let teamBullet = (teamDeathmatch.team1[socket.id]) ? {player: teamDeathmatch.team1[socket.id], bullets: teamDeathmatch.bulletsTeam1} : {player: teamDeathmatch.team2[socket.id], bullets: teamDeathmatch.bulletsTeam2}
                teamDeathmatch.addBullet(teamBullet.player, data.bullet, data.shootTime, socket.id, teamBullet.bullets)
            }
        })

        /** 
         * ========================
         *      Chat Listeners
         * ========================
        */

        socket.on('Chat Message', (data) => {

            if(gamemode === 'online'){
                let name = freeforall.addChatMessage(data.text, freeforall.players[socket.id], data.adminID)

                if(name)
                    io.to(freeforall.roomname).emit('new Chat Message', {name, text: data.text})
            }else if(gamemode === 'teams'){
                let name = teamDeathmatch.addChatMessage(data.text, teamDeathmatch.team1[socket.id] || teamDeathmatch.team2[socket.id], data.adminID)

                if(name)
                    io.to(teamDeathmatch.roomname).emit('new Chat Message', {name, text: data.text})
            }

            
        })

    })

}

module.exports.listen = socketListen