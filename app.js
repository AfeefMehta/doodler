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

let maxLobbies = 10
let lobbies = {}
let socketToLobby = {}

let server = app.listen(port)

let io = socket(server)

let roundFinish = (disconnect, lobbyName) => {
    let lobby = lobbies[lobbyName]
    // Reset round affected data
    lobby.optionPicked = false
    lobby.correctGuessers = []
    lobby.currTime = lobby.turnTime
    clearInterval(lobby.timer)
    io.to(lobbyName).emit('clear-choice-and-timer')
    // The next socket in the list is given its turn and if all sockets have had a turn,
    // the winner is calculated and displayed
    if (lobby.currentPlayer === lobby.players.length - 1) {
        lobby.currentPlayer = 0
        addMessage(generateWinnerMessage(lobby.players), lobby.chat)
        io.to(lobbyName).emit('update-chat-history', {chat_history: lobby.chat})
    } else {
        if (!disconnect) {
            lobby.currentPlayer++
        }
    }
    io.to(lobbyName).emit('paint-clear')
    io.to(lobbyName).emit('round-end')
}

io.on('connection', function(socket) {
    console.log(socket.id)

    socket.on('check-username', function(data) {
        if (Object.values(socketToLobby).map((info) => info.name).includes(data.username)) {
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
            currTime: data.turnTime,
            timer: null,
            chat: [],
            currentPlayer: 0,
            optionPicked: false,
            chosenWord: '',
            correctGuessers: [],
            players: [{ name: data.username, points: 0, id: socket.id}]
        }

        socketToLobby[socket.id] = {
            lobbyName: data.name,
            name: data.username,
            points: 0
        }

        socket.emit('update-option-values', {words: generateWords(wordBank, numWords)})

        io.to(data.name).emit('update-player-list', {usernames: [data.username]})
        
        addMessage(data.username + " has joined.", lobbies[data.name].chat)
        io.to(data.name).emit('update-chat-history', {chat_history: lobbies[data.name].chat})

        io.to(data.name).emit('lobby-created')
    })
    
    //------------------------------------------------------------------------------------
    // A disconnected socket is removed from username and point dictionaries, and the chat room and 
    // player list for remaining sockets reflects their exit
    socket.on('disconnecting', function() {
        Object.keys(lobbies).forEach(lobbyName => {
            if (Object.values(socket.rooms).includes(lobbyName)) {
                let socketName
                for (let i = 0; i < lobbies[lobbyName].players.length; i++) {
                    if (socket.id === lobbies[lobbyName].players[i].id) {
                        socketName = lobbies[lobbyName].players[i].name
                        if (lobbies[lobbyName].currentPlayer === i) {
                            roundFinish(true, lobbyName)
                        }
                        lobbies[lobbyName].players.splice(i, 1)
                        break
                    }
                }

                let lobbyUsers = []
                lobbies[lobbyName].players.forEach((player) => {
                    lobbyUsers.concat(player.name)
                })

                addMessage(socketName + " has left.", lobbies[lobbyName].chat)
                io.to(lobbyName).emit('update-player-list', {usernames: lobbyUsers})
                io.to(lobbyName).emit('update-chat-history', {chat_history: lobbies[lobbyName].chat})
            }
        })

        delete socketToLobby[socket.id]
    })

    // socket.on('disconnect', function() {
    //     addMessage(socketToInfo[socket.id].name + " has left.")
    //     delete socketToInfo[socket.id]

    //     if (socket.id === socketIDs[currSocket]) {
    //         roundFinish(true)
    //     }

    //     io.sockets.emit('update-player-list', {usernames: Object.values(socketToInfo).map((info) => info.name) })
    //     io.sockets.emit('update-chat-history', {chat_history: chat})
    //     socketIDs = Object.keys(socketToInfo)
    // })
    //------------------------------------------------------------------------------------
    // All sockets update their chat history when any client sends a message
    socket.on('update-chat-history', function(data) {
        let lobby = lobbies[socketToLobby[socket.id].lobbyName]
        // A guessing user must guess correctly and also can't keep repeating the correct word to receive points
        if (socket.id !== lobby.players[lobby.currentPlayer].id && data.message === lobby.chosenWord && lobby.correctGuessers.indexOf(socket.id) < 0) {
            addMessage(socketToLobby[socket.id].name + " guessed the word correctly!", lobby.chat)
            socketToLobby.points += (5 * currTime)
            for (let i = 0; i < lobby.players.length; i++) {
                if (lobby.players[i].id === socket.id) {
                    lobby.players[i].points += (5 * currTime)
                }
            }
            socketToLobby[socket.id].points += (5 * currTime)
            lobby.correctGuessers.push(socket.id)
        } else {
            addMessage(socketToLobby[socket.id].name + ": " + data.message, lobby.chat)
        }
        io.to(socketToLobby[socket.id].lobbyName).emit('update-chat-history', {chat_history: lobby.chat})
    })
    //-----------------------------------------------------------------------------------
    // All sockets are notified when the current socket has picked a word and a countdown starts
    socket.on('update-option-choice', function(data) {
        let lobby = lobbies[socketToLobby[socket.id].lobbyName]
        if (socket.id === lobby.players[lobby.currentPlayer].id && !lobby.optionPicked) {
            lobby.optionPicked = true
            lobby.chosenWord = data.choice
            socket.emit('update-option-choice', {choice: "You picked to draw " + lobby.chosenWord + "."})
            socket.to(socketToLobby[socket.id].lobbyName).emit('update-option-choice', {choice: "Guess the word!"})
            
            // Notifies clients initially and at every step of the countdown
            io.to(socketToLobby[socket.id].lobbyName).emit('update-timer', {time_message: socketToLobby[socket.id].name + " has " + lobby.currTime + " seconds left..."})
            lobby.timer = setInterval(function() {
                lobby.currTime -= 1
                io.to(socketToLobby[socket.id].lobbyName).emit('update-timer', {time_message: socketToLobby[socket.id].name + " has " + lobby.currTime + " seconds left..."})

                if (lobby.currTime === 0) {
                    roundFinish(false, socketToLobby[socket.id].lobbyName)
                }
            }, 1000)
        }
    })
    //-----------------------------------------------------------------------------------------
    // Gives words to sockets after previous round ends
    socket.on('give-words', () => {
        let lobby = lobbies[socketToLobby[socket.id].lobbyName]
        if (socket.id === lobby.players[lobby.currentPlayer].id) {
            let words = generateWords(wordBank, numWords)
            socket.emit('update-option-values', {words})
        } else {
            socket.emit('update-option-values', {words: ["Hidden", "Hidden", "Hidden"]})
        }
    })
    //-----------------------------------------------------------------------------------------
    // These serve as gatekeepers, only allowing the current socket to draw
    socket.on('paint-start', function(data) {
        let lobby = lobbies[socketToLobby[socket.id].lobbyName]
        if (socket.id === lobby.players[lobby.currentPlayer].id && lobby.optionPicked) {
            io.to(socketToLobby[socket.id].lobbyName).emit('paint-start', data)
        }
    })
    socket.on('paint-continue', function(data) {
        if (socket.id === lobby.players[lobby.currentPlayer].id && lobby.optionPicked) {
            io.to(socketToLobby[socket.id].lobbyName).emit('paint-continue', data)
        }
    })
    //-----------------------------------------------------------------------------------------
})