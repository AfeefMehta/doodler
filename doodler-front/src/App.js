import { useState, useEffect, useRef } from 'react'
import UserInfo from './components/UserInfo'
import PlayerInfo from './components/PlayerInfo'
import Chatroom from './components/Chatroom';
import Color from './components/Color'
import Word from './components/Word'
import NewLobbyForm from './components/NewLobbyForm'
import LobbyList from './components/LobbyList'
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
      handleTimerStatement(data.timeMessage)
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

const App = () => {
  let [username, setUsername] = useState('')

  let [lobbymode, setLobbymode] = useState(false)
  let [drawmode, setDrawmode] = useState(false)

  let [lobbyName, setLobbyName] = useState('')
  let [lobbyNumWords, setLobbyNumWords] = useState(3)
  let [lobbyRoundTime, setLobbyRoundTime] = useState(60)

  let [lobbyList, setLobbyList] = useState()

  let [words, setWords] = useState([])
  let [playerList, setPlayerList] = useState([])
  let [chat, setChat] = useState([])
  let [message, setMessage] = useState('')

  useEffect(() => {
    socket.on('username-occupied', () => {
      window.alert('username in use already')
    })

    socket.on('username-accepted', (lobbies) => {
      handleLobbyMode(lobbies.lobbies)
    })

    socket.on('draw-ready', () => {
      handleDrawMode()
    })

    socket.on('update-word-values', (data) => {
      handleWords(data.words)
    })

    socket.on('update-player-list', (data) => {
      handlePlayerList(data.usernames)
    })

    socket.on('update-chat-history', (data) => {
      handleChat(data.chat)
    })
  }, [])

  let handleUsername = (event) => {
    setUsername(event.target.value)
  }
  let handleUsernameSubmit = (event) => {
    event.preventDefault()
    if (username.length < 1) {
      window.alert("The username must contain at least 1 character")
    } else {
      socket.emit('check-username', {username})
    }
  }

  let handleLobbyMode = (lobbies) => {
    setLobbyList(lobbies)
    setLobbymode(true)
  }
  let handleDrawMode = () => {
    setDrawmode(true)
  }

  let handleLobbyName = (event) => {
    setLobbyName(event.target.value)
  }
  let handleLobbyNumWords = (event) => {
    setLobbyNumWords(event.target.value)
  }
  let handleLobbyRoundTime = (event) => {
    setLobbyRoundTime(event.target.value)
  }
  let handleCreateLobby = () => {
    console.log(lobbyName)
    if (lobbyNumWords < 1 || lobbyNumWords > 4) {
      window.alert('invalid value for number of words')
    } else if (lobbyRoundTime < 5 || lobbyRoundTime > 300) {
      window.alert('invalid value for round time')
    } else if (lobbyName.length < 1) {
      window.alert('lobby name must be at least 1 character')
    } else {
      socket.emit('create-lobby', {lobbyName, lobbyNumWords, lobbyRoundTime, username})
    }
  }

  let handleJoinLobby = (event) => {
    socket.emit('join-lobby', {lobbyName: event.target.id, username})
  }

  let handleChat = (chat) => {
    setChat(chat)
  }
  let handlePlayerList = (players) => {
    setPlayerList(players)
  }
  let handleWords = (currentWords) => {
    setWords(currentWords)
  }

  let handleMessage = (event) => {
    setMessage(event.target.value)
  }
  let handleMessageSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    socket.emit('update-chat-history', {message})
  }

  if (drawmode) {
    return (
      <div id="play-area">
        <PlayerInfo username={username} players={playerList} />
        <DrawingCanvas words={words} />
        <Chatroom chat={chat} message={message} handleMessage={handleMessage} handleMessageSubmit={handleMessageSubmit} />
      </div>
    )
  } else if (lobbymode) {
    return (
      <div>
        <NewLobbyForm handleLobbyName={handleLobbyName} handleLobbyNumWords={handleLobbyNumWords} handleLobbyRoundTime={handleLobbyRoundTime} handleCreateLobby={handleCreateLobby} />
        <LobbyList lobbyList={lobbyList} handleJoinLobby={handleJoinLobby} />
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
