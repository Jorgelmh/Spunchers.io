/**
 *  =======================
 *      TESTING FUNCTIONS
 *  =======================
 */


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

const colissionable = [
    {
        x: 3,
        y: 4
    },
    {
        x: 5,
        y: 4
    }
]

const colissionsTest = (width, height, points) => {

    let matrix = []
    for(let i = 0; i < height; i++){
        matrix.push([])

        for(let j = 0; j < width; j++){
            if(points.find((elem) => elem.x === j && elem.y === i))
                matrix[i].push(37)
            else
                matrix[i].push(0)
        }
    }

    return matrix
}

module.exports = {
    colissionsTest,
    generateRandomMap,
    colissionable
}
