const express = require('express')
const socket = require('socket.io')
const { generateWords, generateWinnerMessage, addMessage } = require('./serv_lib')

let app = express()

const port = 8000
const wordBank = [
    "baseball", "coffee", "apartment", "eyelash", "cushion", "pokemon", "artist",
    "bison", "restaurant", "moustache", "computer", "ladybug", "explosion", "boulder",
    "egypt", "planet", "universe", "dandelion", "garbage", "shovel", "telephone"
]

let numWords = 3
let words = generateWords(wordBank, numWords)

let socketToInfo = {}
let socketIDs

let timer

let optionPicked = false

let currSocket = 0
let chosenWord = null
let correctGuessers = []

const roundTime = 10
let currTime = roundTime

let maxLobbies = 10
let lobbies = {}

let server = app.listen(port)

let io = socket(server)

let roundFinish = (disconnect) => {
    // Reset round affected data
    optionPicked = false
    correctGuessers = []
    currTime = roundTime
    clearInterval(timer)
    io.sockets.emit('clear-choice-and-timer')
    // The next socket in the list is given its turn and if all sockets have had a turn,
    // the winner is calculated and displayed
    if (currSocket === socketIDs.length - 1) {
        currSocket = 0
        addMessage(generateWinnerMessage(socketToInfo))
        io.sockets.emit('update-chat-history', {chat_history: chat})
    } else {
        if (!disconnect) {
            currSocket++
        }
    }
    io.sockets.emit('paint-clear')
    io.sockets.emit('round-end')
}

io.on('connection', function(socket) {
    console.log(socket.id)

    socket.on('check-username', function(data) {
        if (Object.values(socketToInfo).map((info) => info.name).includes(data.username)) {
            socket.emit('username-occupied')
        } else {
            socket.emit('username-accepted')
            // socketToInfo[socket.id] = { name: data.username, points: 0 }
            // socketIDs = Object.keys(socketToInfo)
    
            // if (socket.id !== socketIDs[currSocket]) {
            //     socket.emit('update-option-values', {words: ["Hidden", "Hidden", "Hidden"]})
            // } else {
            //     socket.emit('update-option-values', {words: words})
            // }
    
            // addMessage(socketToInfo[socket.id].name + " has joined.")
    
            // io.sockets.emit('update-player-list', {usernames: Object.values(socketToInfo).map((info) => info.name) })
            // io.sockets.emit('update-chat-history', {chat_history: chat})  
        }
    })

    socket.on('create-lobby', function(data) {
        socket.join(data.name)

        lobbies[data.name] = {
            numOptions: data.numOptions,
            turnTime: data.turnTime,
            chat: [],
            currentPlayer: 0,
            players: [{ name: data.username, points: 0 , id: socket.id}]
        }

        socket.emit('update-option-values', {words: generateWords(wordBank, numWords)})

        io.to(data.name).emit('update-player-list', {usernames: data.username})
        
        addMessage(data.username + " has joined.", lobbies[data.name].chat)
        io.to(data.name).emit('update-chat-history', {chat_history: lobbies[data.name].chat})
    })
    
    //------------------------------------------------------------------------------------
    // A disconnected socket is removed from username and point dictionaries, and the chat room and 
    // player list for remaining sockets reflects their exit
    socket.on('disconnect', function() {
        addMessage(socketToInfo[socket.id].name + " has left.")
        delete socketToInfo[socket.id]

        if (socket.id === socketIDs[currSocket]) {
            roundFinish(true)
        }

        io.sockets.emit('update-player-list', {usernames: Object.values(socketToInfo).map((info) => info.name) })
        io.sockets.emit('update-chat-history', {chat_history: chat})
        socketIDs = Object.keys(socketToInfo)
    })
    //------------------------------------------------------------------------------------
    // All sockets update their chat history when any client sends a message
    socket.on('update-chat-history', function(data) {
        // A guessing user must guess correctly and also can't keep repeating the correct word to receive points
        if (socket.id !== socketIDs[currSocket] && data.message === chosenWord && correctGuessers.indexOf(socket.id) < 0) {
            addMessage(socketToInfo[socket.id].name + " guessed the word correctly!")
            socketToInfo[socket.id].points += (5 * currTime)
            correctGuessers.push(socket.id)
        } else {
            addMessage(socketToInfo[socket.id].name + ": " + data.message)
        }
        io.sockets.emit('update-chat-history', {chat_history: chat})
    })
    //-----------------------------------------------------------------------------------
    // All sockets are notified when the current socket has picked a word and a countdown starts
    socket.on('update-option-choice', function(data) {
        if (socket.id === socketIDs[currSocket] && !optionPicked) {
            optionPicked = true
            chosenWord = data.choice
            socket.emit('update-option-choice', {choice: "You picked to draw " + chosenWord + "."})
            socket.broadcast.emit('update-option-choice', {choice: "Guess the word!"})
            
            // Notifies clients initially and at every step of the countdown
            io.sockets.emit('update-timer', {time_message: socketToInfo[socket.id].name + " has " + currTime + " seconds left..."})
            timer = setInterval(function() {
                currTime -= 1
                io.sockets.emit('update-timer', {time_message: socketToInfo[socket.id].name + " has " + currTime + " seconds left..."})

                if (currTime === 0) {
                    roundFinish(false)
                }
            }, 1000)
        }
    })
    //-----------------------------------------------------------------------------------------
    // Gives words to sockets after previous round ends
    socket.on('give-words', () => {
        if (socket.id === socketIDs[currSocket]) {
            words = generateWords(wordBank, numWords)
            socket.emit('update-option-values', {words})
        } else {
            socket.emit('update-option-values', {words: ["Hidden", "Hidden", "Hidden"]})
        }
    })
    //-----------------------------------------------------------------------------------------
    // These serve as gatekeepers, only allowing the current socket to draw
    socket.on('paint-start', function(data) {
        if (socket.id === socketIDs[currSocket] && optionPicked) {
            io.sockets.emit('paint-start', data)
        }
    })
    socket.on('paint-continue', function(data) {
        if (socket.id === socketIDs[currSocket] && optionPicked) {
            io.sockets.emit('paint-continue', data)
        }
    })
    //-----------------------------------------------------------------------------------------
})