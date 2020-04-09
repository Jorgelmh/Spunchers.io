import engine from './engine.js'

//Load the engine

const generateRandomMap = (width, height) => {
    let matrix = []

    for(let i = 0; i < height; i++){
        matrix.push([])
        for(let j = 0; j < width; j++){
            matrix[i].push(Math.floor(Math.random() * 10))
        }
    }

    return matrix
}


engine.load(generateRandomMap(16, 9))

