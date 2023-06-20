const express = require('express')
const socket = require('socket.io')
const { generateWords, generateWinnerMessage, addMessage } = require('./helper')

const port = 8000
const wordBank = [
    "baseball", "coffee", "apartment", "eyelash", "cushion", "pokemon", "artist",
    "bison", "restaurant", "moustache", "computer", "ladybug", "explosion", "boulder",
    "egypt", "planet", "universe", "dandelion", "garbage", "shovel", "telephone"
]

let lobbies = {}
let socketInfo = {}

let app = express()
let server = app.listen(port)
let io = socket(server)

let roundFinish = (disconnect, lobby) => {
    // reset round affected properties in lobby
    lobby.optionPicked = false
    lobby.correctGuessers = []
    lobby.currTime = lobby.turnTime
    clearInterval(lobby.timer)
    io.to(lobby.name).emit('clear-choice-and-timer')

    // gives final score once all players have drawn or skips player if they disconnect
    if (lobby.currentPlayer === lobby.players.length - 1) {
        lobby.currentPlayer = 0
        addMessage(generateWinnerMessage(lobby.players), lobby.chat)
        io.to(lobby.name).emit('update-chat-history', {chat: lobby.chat})
    } else {
        if (!disconnect) {
            lobby.currentPlayer++
        }
    }

    // update client with blank canvas and new round
    io.to(lobby.name).emit('paint-clear')
    io.to(lobby.name).emit('round-end')
}

io.on('connection', function(socket) {
    console.log(socket.id)

    //------------------------------------------------------------------------------------
    // checks if username has already joined server currently
    socket.on('check-username', function(data) {
        if (Object.values(socketInfo).map((info) => info.username).includes(data.username)) {
            socket.emit('username-occupied')
        } else {
            socket.emit('username-accepted', {lobbies}) 
        }
    })

    //------------------------------------------------------------------------------------
    // initializes a lobby with given properties and adds user to it
    socket.on('create-lobby', function(data) {
        socket.join(data.lobbyName)

        lobbies[data.lobbyName] = {
            name: data.lobbyName,
            numOptions: data.lobbyNumWords,
            turnTime: data.lobbyRoundTime,
            currTime: data.lobbyRoundTime,
            timer: null,
            chat: [],
            currentPlayer: 0,
            optionPicked: false,
            chosenWord: '',
            correctGuessers: [],
            players: [{ username: data.username, points: 0, id: socket.id}]
        }

        socketInfo[socket.id] = {
            lobbyName: data.lobbyName,
            username: data.username,
            points: 0
        }

        // update player list and chat for client
        socket.emit('update-option-values', {words: generateWords(wordBank, data.lobbyNumWords)})
        io.to(data.lobbyName).emit('update-player-list', {usernames: [data.username]})
        
        addMessage(data.username + " has joined.", lobbies[data.lobbyName].chat)
        io.to(data.lobbyName).emit('update-chat-history', {chat: lobbies[data.lobbyName].chat})

        io.to(data.lobbyName).emit('draw-ready')
    })

    //------------------------------------------------------------------------------------
    // keeps track of user in new lobby internally
    socket.on('join-lobby', function(data) {
        socket.join(data.lobbyName)
        lobbies[data.lobbyName].players.push({username: data.username, points: 0, id: socket.id})

        socketInfo[socket.id] = {
            lobbyName: data.lobbyName,
            username: data.username,
            points: 0
        }

        // update player list and chat for client
        socket.emit('update-option-values', {words: ['Hidden', 'Hidden', 'Hidden']})
        io.to(data.lobbyName).emit('update-player-list', {usernames: lobbies[data.lobbyName].players.map(player => player.username)})
        
        addMessage(data.username + " has joined.", lobbies[data.lobbyName].chat)
        io.to(data.lobbyName).emit('update-chat-history', {chat: lobbies[data.lobbyName].chat})

        io.to(data.lobbyName).emit('draw-ready')
    })
    
    //------------------------------------------------------------------------------------
    // a disconnected socket is removed from the player list for the respective lobby
    socket.on('disconnecting', function() {

        let lobby = lobbies[socketInfo[socket.id].lobbyName]
        let socketName = socketInfo[socket.id].username

        // delete lobby if the only player leaves
        if (lobby.players.length === 1) {
            delete lobbies[lobby.name]

        } else {
            // lobby removes player from player list
            for (let i = 0; i < lobby.players.length; i++) {
                if (socket.id === lobby.players[i].id) {
                    if (lobby.currentPlayer === i) {
                        roundFinish(true, lobby)
                    }
                    lobby.players.splice(i, 1)
                }
            }

            // update lobby on client side
            addMessage(socketName + " has left.", lobby.chat)
            io.to(lobby.name).emit('update-player-list', {usernames: lobby.players.map(player => player.username)})
            io.to(lobby.name).emit('update-chat-history', {chat: lobby.chat})
        }

        delete socketInfo[socket.id]
    })

    //------------------------------------------------------------------------------------
    // all sockets update their chat history when any client sends a message
    socket.on('update-chat-history', function(data) {
        let lobby = lobbies[socketInfo[socket.id].lobbyName]
        let socketName = socketInfo[socket.id].username

        // a non-drawing user must guess right and can't keep guessing to get points
        if (socket.id !== lobby.players[lobby.currentPlayer].id && data.message === lobby.chosenWord && lobby.correctGuessers.indexOf(socket.id) < 0) {
            addMessage(socketName + " guessed the word correctly!", lobby.chat)
            socketInfo[socket.id].points += (5 * lobby.currTime)

            for (let i = 0; i < lobby.players.length; i++) {
                if (lobby.players[i].id === socket.id) {
                    lobby.players[i].points += (5 * lobby.currTime)
                }
            }
            lobby.correctGuessers.push(socket.id)

        // just sending a regular message
        } else {
            addMessage(socketInfo[socket.id].username + ": " + data.message, lobby.chat)
        }

        // update clients chatbox
        io.to(socketInfo[socket.id].lobbyName).emit('update-chat-history', {chat: lobby.chat})
    })

    //-----------------------------------------------------------------------------------
    // all lobby users are notified and the round starts when the drawer has selected a word
    socket.on('update-option-choice', function(data) {
        let lobby = lobbies[socketInfo[socket.id].lobbyName]

        // When the drawing user picks a word, it changes the instructions for each connected user
        if (socket.id === lobby.players[lobby.currentPlayer].id && !lobby.optionPicked) {
            lobby.optionPicked = true
            lobby.chosenWord = data.choice
            socket.emit('update-option-choice', {choice: "You have to draw \"" + lobby.chosenWord + "\"."})
            socket.to(socketInfo[socket.id].lobbyName).emit('update-option-choice', {choice: "Guess the word!"})
            
            // notifies clients of lobby at every step of the countdown
            io.to(socketInfo[socket.id].lobbyName).emit('update-timer', {timeMessage: socketInfo[socket.id].name + " has " + lobby.currTime + " seconds left..."})
            lobby.timer = setInterval(function() {
                lobby.currTime -= 1
                io.to(socketInfo[socket.id].lobbyName).emit('update-timer', {timeMessage: socketInfo[socket.id].name + " has " + lobby.currTime + " seconds left..."})

                if (lobby.currTime === 0) {
                    roundFinish(false, lobby)
                }
            }, 1000)
        }
    })

    //-----------------------------------------------------------------------------------------
    // gives a new set of words to the next user after the current round ends
    socket.on('give-words', () => {
        let lobby = lobbies[socketInfo[socket.id].lobbyName]

        if (socket.id === lobby.players[lobby.currentPlayer].id) {
            let words = generateWords(wordBank, numWords)
            socket.emit('update-option-values', {words})
        } else {
            socket.emit('update-option-values', {words: ["Hidden", "Hidden", "Hidden"]})
        }
    })

    //-----------------------------------------------------------------------------------------
    // these callback functions serve as gatekeepers, only allowing the correct user to draw
    socket.on('paint-start', function(data) {
        let lobby = lobbies[socketInfo[socket.id].lobbyName]

        if (socket.id === lobby.players[lobby.currentPlayer].id && lobby.optionPicked) {
            io.to(socketInfo[socket.id].lobbyName).emit('paint-start', data)
        }
    })

    socket.on('paint-continue', function(data) {
        let lobby = lobbies[socketInfo[socket.id].lobbyName]

        if (socket.id === lobby.players[lobby.currentPlayer].id && lobby.optionPicked) {
            io.to(socketInfo[socket.id].lobbyName).emit('paint-continue', data)
        }
    })
})