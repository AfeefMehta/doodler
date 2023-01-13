let chatLimit = 25
let chat = []

// generates a given number of words randomly from a given word bank
const generateWords = (wordBank, numWords) => {
    let words = []

    for (let i = 0; i < numWords; i++) {
        let wordIndex = Math.floor(Math.random() * wordBank.length)
        let word = wordBank[wordIndex]
        while (words.includes(word)) {
            wordIndex = Math.floor(Math.random() * wordBank.length)
            word = wordBank[wordIndex]
        }
        words.push(word)
    }

    return words
}

// generates the message for player rankings at the end of the round
const generateWinnerMessage = (socketToInfo) => {
    let sortedPlayers = []
    let players = Object.keys(socketToInfo)

    for (let i = 0; i < players.length; i++) {
        sortedPlayers.push(socketToInfo[players[i]])
    }
    sortedPlayers.sort((a, b) => {
        if (a.points < b.points) {
            return 1
        } else if (a.points > b.points) {
            return -1
        } else {
            return 0
        }
    })

    let winnerMessage = ''
    for (let i = 0; i < sortedPlayers.length; i++) {
        let message = "#" + (i + 1).toString() + ": " + sortedPlayers[i].name + ", " + sortedPlayers[i].points.toString() + " points. <br />"
        winnerMessage += message
    }

    return winnerMessage
}

const addMessage = (message) => {
    if (chat.length === chatLimit) {
        chat.shift()
    }
    chat.push(message)
}

module.exports = { generateWords, generateWinnerMessage, addMessage, chat, chatLimit }