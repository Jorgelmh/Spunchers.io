const path = require('path');

module.exports = {
    entry: './server/public/assets/js/online.js',
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