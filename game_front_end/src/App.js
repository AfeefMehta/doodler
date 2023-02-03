import { useState, useEffect, useRef } from 'react'
import UserInfo from './components/UserInfo'
import PlayerInfo from './components/PlayerInfo'
import Chatroom from './components/Chatroom';
import Color from './components/Color'
import Word from './components/Word'
import socketClient from "socket.io-client";

let socket = socketClient("http://localhost:8000");

const DrawingCanvas = ({ words }) => {
  let [mouseHeld, setMouseHeld] = useState(false)
  let [initialRender, setInitialRender] = useState(true)
  let [prevXY, setPrevXY] = useState({X: 0, Y: 0})
  let [currXY, setCurrXY] = useState({X: 0, Y: 0})
  let [color, setColor] = useState('black')
  let [brushSize, setBrushSize] = useState(2)
  let [chosenWord, setChosenWord] = useState('')
  let [chosenStatement, setChosenStatement] = useState('')
  let [timerStatement, setTimerStatement] = useState('')
  let wordID = 0

  let colors = ["red", "blue", "green", "yellow", "orange", "cyan", "purple", "brown", "black", "white"]

  let canvasRef = useRef(null)
  let optionsRef = useRef(null)

  useEffect(() => {
    if (initialRender) {
      toggleInitialRender()
    } else if (!mouseHeld) {
      socket.emit('paint-start', {currXY: currXY, brushSize: brushSize, color: color})
      handleMouseOn()
    } else {
      socket.emit('paint-continue', {prevXY: prevXY, currXY: currXY, brushSize: brushSize, color: color})
    }
  }, [currXY])

  useEffect(() => {
    if (!initialRender) {
      socket.emit('update-option-choice', {choice: chosenWord})
    }
  }, [chosenWord])

  useEffect(() => {
    let canvas = canvasRef.current
    let ctx = canvas.getContext('2d')

    socket.on('paint-start', (data) => {
      ctx.beginPath();
      ctx.fillStyle = data.color;
      ctx.fillRect(data.currXY.X, data.currXY.Y, data.brushSize, data.brushSize);
      ctx.closePath();
    })

    socket.on('paint-continue', (data) => {
      ctx.beginPath();
      ctx.moveTo(data.prevXY.X, data.prevXY.Y);
      ctx.lineTo(data.currXY.X, data.currXY.Y);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.brushSize;
      ctx.stroke();
      ctx.closePath();
    })

    socket.on('update-option-choice', (data) => {
      handleChosenStatement(data.choice)
    })

    socket.on('update-timer', (data) => {
      handleTimerStatement(data.time_message)
    })

    socket.on('clear-choice-and-timer', () => {
      handleClearStatements()
    })

    socket.on('round-end', () => {
      socket.emit('give-words')
    })

    socket.on('paint-clear', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
  }, [])

  let handleClearStatements = () => {
    setChosenStatement('')
    setTimerStatement('')
  }
  let handleTimerStatement = (statement) => {
    setTimerStatement(statement)
  }
  let handleChosenStatement = (statement) => {
    setChosenStatement(statement)
  }
  let toggleInitialRender = () => {
    setInitialRender(!initialRender)
  }
  let handleMouseDownPaint = (event) => {
    setPrevXY({X: currXY.X, Y: currXY.Y})
    setCurrXY({X: event.clientX - event.target.offsetLeft, Y: event.clientY - event.target.offsetTop})
  }

  let handleMouseMovePaint = (event) => {
    if (mouseHeld) {
      setPrevXY({X: currXY.X, Y: currXY.Y})
      setCurrXY({X: event.clientX - event.target.offsetLeft, Y: event.clientY - event.target.offsetTop})
    }
  }
  let handleMouseOff = () => {
    setMouseHeld(false)
  }
  let handleMouseOn = () => {
    setMouseHeld(true)
  }
  let handlePickColor = (event) => {
    setColor(event.target.id)
  }
  let handlePickWord = (event) => {
    if (event.target.id !== "Hidden") {
      setChosenWord(event.target.id)
    }
  }

  return (
    <div className="full-canvas">
      <canvas ref={canvasRef} width="800px" height="400px"
        onMouseDown={handleMouseDownPaint} onMouseMove={handleMouseMovePaint} onMouseOut={handleMouseOff} onMouseUp={handleMouseOff}>
      </canvas><br />
      <div id="color-picker">
        {
          colors.map(color => <Color key={color} color={color} handlePickColor={handlePickColor} />)
        }
      </div>
      <div className="option-picker text" ref={optionsRef}>
        {
          words.map(word => 
            {
              wordID++
              return (<Word key = {wordID} word={word} handlePickWord={handlePickWord} />)
            })
        }
      </div>
      <div className="clock-area text">
        <p id="clock">{timerStatement}</p>
      </div>
      <div className="choice-area text">
        <p id="choice">{chosenStatement}</p>
      </div>
    </div>
  )
}

const NewLobbyForm = ({ handleLobbyName, handleLobbyOptions, handleLobbyRoundTime, handleNewLobby }) => {
  return (
    <div>
      <p>Enter Lobby Name:</p>
      <input type="text" onChange={handleLobbyName}></input>
      <p>Number of word options for drawer:</p>
      <input type="number" max="4" min="1" onChange={handleLobbyOptions} placeholder="3"></input>
      <p>Time per drawer:</p>
      <input type="number" max="300" min="1" onChange={handleLobbyRoundTime} placeholder="60"></input>
      <button onClick={handleNewLobby}>Create</button>
    </div>
  )
}

const App = () => {
  let [username, setUsername] = useState('')
  let [drawmode, setDrawmode] = useState(false)

  let [lobbymode, setLobbymode] = useState(false)
  let [lobbyName, setLobbyName] = useState('')
  let [lobbyOptions, setLobbyOptions] = useState(3)
  let [lobbyRoundTime, setLobbyRoundTime] = useState(60)

  let [words, setWords] = useState([])
  let [playerList, setPlayerList] = useState([])
  let [chatHistory, setChatHistory] = useState([])
  let [message, setMessage] = useState('')

  useEffect(() => {
    socket.on('update-option-values', (data) => {
      handleWords(data.words)
    })

    socket.on('update-player-list', (data) => {
      handlePlayerList(data.usernames)
    })

    socket.on('update-chat-history', (data) => {
      handleChatHistory(data.chat_history)
    })

    socket.on('username-occupied', () => {
      window.alert('username in use already')
    })

    socket.on('username-accepted', () => {
      handleLobbyMode()
    })
  }, [])

  let handleChatHistory = (chat) => {
    setChatHistory(chat)
  }
  let handlePlayerList = (players) => {
    setPlayerList(players)
  }
  let handleWords = (currentWords) => {
    setWords(currentWords)
  }

  let handleLobbyMode = () => {
    setLobbymode(true)
  }
  let handleDrawMode = () => {
    setDrawmode(true)
  }

  let handleLobbyName = (event) => {
    setLobbyName(event.target.value)
  }
  let handleLobbyOptions = (event) => {
    setLobbyOptions(event.target.value)
  }
  let handleLobbyRoundTime = (event) => {
    setLobbyRoundTime(event.target.value)
  }
  let handleNewLobby = () => {
    socket.emit('create-lobby', {name: lobbyName, numOptions: lobbyOptions, turnTime: lobbyRoundTime, username: username})
    setDrawmode(true)
  }

  let handleMessage = (event) => {
    setMessage(event.target.value)
  }
  let handleMessageSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    socket.emit('update-chat-history', {message: message})
  }

  let handleUsername = (event) => {
    setUsername(event.target.value)
  }
  let handleUsernameSubmit = (event) => {
    event.preventDefault()
    if (username === '') {
      window.alert("The username must contain at least 1 character")
    } else {
      socket.emit('check-username', {username: username})
    }
  }

  if (drawmode) {
    return (
      <div id="play-area">
        <PlayerInfo username={username} players={playerList} />
        <DrawingCanvas words={words} />
        <Chatroom chat={chatHistory} message={message} handleMessage={handleMessage} handleMessageSubmit={handleMessageSubmit} />
      </div>
    )
  } else if (lobbymode) {
    return (
      <div>
        <NewLobbyForm handleLobbyName={handleLobbyName} handleLobbyOptions={handleLobbyOptions} handleLobbyRoundTime={handleLobbyRoundTime} handleNewLobby={handleNewLobby} />
      </div>
    )
  } else {
    return (
      <>
        <UserInfo handleSubmit={handleUsernameSubmit} handleUsername={handleUsername} username={username} />
      </> 
    )
  }
}

export default App;
