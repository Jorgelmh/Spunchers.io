/**
 * ===========================
 *       Websocket logic
 * ===========================
 */

const socketIO = require('socket.io')
const FreeforAll = require('./classes/games/FreeforAll')
const TeamDeathmatch = require('./classes/games/TeamDeathmatch')
const CaptureTheFlag = require('./classes/games/CaptureTheFlag')

const map = require('./maps/castle.json')

/* Socket listener */
const socketListen = (app) => {

    const io = socketIO(app, {pingInterval: 1000})

    //Lobby for freeforall game and start game loop
    const freeforall = new FreeforAll(map, io)
    freeforall.setUpdate()
    
    /* Lobby for team deathmatch game and start game loop */
    const teamDeathmatch = new TeamDeathmatch(map, io)
    teamDeathmatch.setUpdate()

    /* Lobby for team capture the flag game and start game loop */
    const captureTheFlag = new CaptureTheFlag(map, io)
    captureTheFlag.setUpdate()
    
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

        }else if(gamemode === 'ctf'){
            socket.emit('loadMap', captureTheFlag.onLoadMap(socket.id))
            socket.join(captureTheFlag.roomname)
            socket.emit('load team members', captureTheFlag.getPlayers())
        }

        /* When a new player enters the lobby => Note: Validations on repetitions are in the client version of the game*/
        socket.on('New Player', (data) => {

            /* Skins needed to be loaded on the engine */
            let skins
            let roomname
            let ids

            /* 0 -> Free for all */
            if(data.game.mode === freeforall.gameCode){
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
            else if(data.game.mode === teamDeathmatch.gameCode){

               teamDeathmatch.selectTeam(data, socket.id)
        
               let [skinteams, idTeams] = teamDeathmatch.prepareNewPlayer(socket.id)

                skins = skinteams
                ids = idTeams

                roomname = teamDeathmatch.roomname

                /* Send scores */
                socket.emit('New teams leaderboard', teamDeathmatch.scores)
               
            }

            /* 2 -> Capture the flag */
            else if(data.game.mode === captureTheFlag.gameCode){
                captureTheFlag.selectTeam(data, socket.id)

                let [skinteams, idTeams] = captureTheFlag.prepareNewPlayer(socket.id)

                skins = skinteams
                ids = idTeams

                roomname = captureTheFlag.roomname
                
                /* Send scores */
                socket.emit('New teams leaderboard', captureTheFlag.scoresFlag)

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
                teamDeathmatch.onMovement(teamDeathmatch.blueTeam[socket.id] || teamDeathmatch.redTeam[socket.id], data, socket.id)
            
            else if(gamemode === 'ctf')
                captureTheFlag.onMovement(captureTheFlag.blueTeam[socket.id] || captureTheFlag.redTeam[socket.id], data, socket.id)
            
        })

        socket.on('disconnect', (data) => {

            if(gamemode === 'online'){

                freeforall.removePlayer(socket.id) 
                socket.to(freeforall.roomname).emit('Player Disconnected', socket.id)

            }else if(gamemode === 'teams'){

                teamDeathmatch.removePlayer(socket.id)
                socket.to(teamDeathmatch.roomname).emit('Player Disconnected', socket.id)

            }else if(gamemode === 'ctf'){

                captureTheFlag.removePlayer(socket.id)
                socket.to(captureTheFlag.roomname).emit('Player Disconnected', socket.id)

            }
        })

        socket.on('reload weapon', (data) => {

            if(gamemode === 'online')
                freeforall.reloadPlayerWeapon(freeforall.players[socket.id])

            else if(gamemode === 'teams')
                teamDeathmatch.reloadPlayerWeapon(teamDeathmatch.blueTeam[socket.id] || teamDeathmatch.redTeam[socket.id])
            
            else if(gamemode === 'ctf')
                captureTheFlag.reloadPlayerWeapon(captureTheFlag.blueTeam[socket.id] || captureTheFlag.redTeam[socket.id])
        })

        /* Listener of players shooting */
        socket.on('shoot',(data) => {

            /* Call functions and send bullet's details and id of the player */
            if(gamemode === 'online')
                freeforall.addBullet(freeforall.players[socket.id], data.bullet, data.shootTime, socket.id)
            else if(gamemode === 'teams'){
                let teamBullet = (teamDeathmatch.blueTeam[socket.id]) ? {player: teamDeathmatch.blueTeam[socket.id], bullets: teamDeathmatch.bulletsBlueTeam} : {player: teamDeathmatch.redTeam[socket.id], bullets: teamDeathmatch.bulletsRedTeam}
                teamDeathmatch.addBullet(teamBullet.player, data.bullet, data.shootTime, socket.id, teamBullet.bullets)
            }

            else if(gamemode === 'ctf'){
                let teamBullet = (captureTheFlag.blueTeam[socket.id]) ? {player: captureTheFlag.blueTeam[socket.id], bullets: captureTheFlag.bulletsBlueTeam} : {player: captureTheFlag.redTeam[socket.id], bullets: captureTheFlag.bulletsRedTeam}
                captureTheFlag.addBullet(teamBullet.player, data.bullet, data.shootTime, socket.id, teamBullet.bullets)
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
                let name = teamDeathmatch.addChatMessage(data.text, teamDeathmatch.blueTeam[socket.id] || teamDeathmatch.redTeam[socket.id], data.adminID)

                if(name)
                    io.to(teamDeathmatch.roomname).emit('new Chat Message', {name, text: data.text})

            }else if(gamemode === 'ctf'){
                let name = captureTheFlag.addChatMessage(data.text, captureTheFlag.blueTeam[socket.id] || captureTheFlag.redTeam[socket.id], data.adminID)

                if(name)
                    io.to(captureTheFlag.roomname).emit('new Chat Message', {name, text: data.text})
            }

            
        })

    })

}

module.exports.listen = socketListen