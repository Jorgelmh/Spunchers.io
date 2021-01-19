//Importing config
require('./config/config')

const socket = require('./sockets/socket')
const express = require('express')
const app = express()
const path = require('path')
const server = require('http').createServer(app);

//Add the websocket logic to the server
socket.listen(server)

/* Middlewares */
app.use(express.static(__dirname+'/public'))

app.set('port', process.env.PORT)

//Routes that will ne moved to a different folder soon
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/Pages/index.html'))
})

app.get('/online', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/Pages/online.html'))
})

app.get('/teams', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/Pages/teams.html'))
})

app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/Pages/offline.html'))
})

server.listen(process.env.PORT ,() => {
    console.log(`Listening port: ${process.env.PORT}`);
})


