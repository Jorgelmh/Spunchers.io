//Importing config
require('./config/config')

const socket = require('./sockets/socket')
const express = require('express')
const hbs = require('hbs')

const app = express()
const path = require('path')
const server = require('http').createServer(app);

//Add the websocket logic to the server
socket.listen(server)

/* Middlewares */
app.use(express.static(__dirname+'/public'))
hbs.registerPartials(__dirname + '/public/views/partials')

app.set('view engine', 'hbs')

app.set('port', process.env.PORT)
app.set('views', __dirname + '/public/views')

//Routes of server-side application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/views/index.html'))
})

app.get('/online', (req, res) => {
    res.render('online')
})

app.get('/teams', (req, res) => {
    res.render('teams')
})

app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname + 'public/views/offline.html'))
})

server.listen(process.env.PORT ,() => {
    console.log(`Listening port: ${process.env.PORT}`);
})


