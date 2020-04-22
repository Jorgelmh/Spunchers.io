const path = require('path');

/*
 ===========================
    WEBPACK CONFIGURATION
 ===========================

 Note: Important to use npm packages of the server
 the compiled code will be in dist/main.js

 Note2: Babel to write ES 6, as most of my classes are written in new JS

*/
module.exports = {
    entry: './server/client/js/online.js',
    mode: 'development',
    output: {
        filename: 'main.js',
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