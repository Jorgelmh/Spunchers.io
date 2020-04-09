//Importing config
require('./config/config')
const express = require('express')
const app = express()
const path = require('path')

app.use(express.static(__dirname+'/public/assets'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'))
})

app.listen(process.env.PORT ,() => {
    console.log(`Listening port: ${process.env.PORT}`);
})