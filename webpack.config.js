const path = require('path');

/*
 ===========================
    WEBPACK CONFIGURATION
 ===========================

 Note: Important to use npm packages of the server
 the compiled code will be at dist/main.js

 Note2: Babel to write ES 6, as most of my classes are written in new JS

*/
module.exports = {
    entry: {
        online: './server/client/js/online.js',
        teams: './server/client/js/teams.js',
        loadcharacters: './server/client/js/loadcharacters.js'
    },
    mode: 'development',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'server/public/dist'),
    },
    module:{
        rules:[
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['@babel/env']
                }
            }
        ]
    },
};