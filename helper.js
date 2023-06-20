let chatLimit = 25

// generates a given number of words randomly from a given word bank
const generateWords = (wordBank, numWords) => {
    let words = []

    for (let i = 0; i < numWords; i++) {
        let wordIndex = Math.floor(Math.random() * wordBank.length)
        let word = wordBank[wordIndex]

        // keep generating a word until it's found to be distinct
        while (words.includes(word)) {
            wordIndex = Math.floor(Math.random() * wordBank.length)
            word = wordBank[wordIndex]
        }
        words.push(word)
    }

    return words
}

// generates the message for player rankings at the end of the game
const generateWinnerMessage = (players) => {
    let playersCopy = players.map(player => player)

    playersCopy.sort((a, b) => {
        if (a.points < b.points) {
            return 1
        } else if (a.points > b.points) {
            return -1
        } else {
            return 0
        }
    })

    let winnerMessage = ''
    for (let i = 0; i < playersCopy.length; i++) {
        let message = "#" + (i + 1).toString() + ": " + playersCopy[i].name + ", " + playersCopy[i].points.toString() + " points. "
        winnerMessage += message
    }

    return winnerMessage
}

// adds message to chatbox for a lobby
const addMessage = (message, chat) => {
    if (chat.length === chatLimit) {
        chat.shift()
    }
    chat.push(message)
}

module.exports = { generateWords, generateWinnerMessage, addMessage }