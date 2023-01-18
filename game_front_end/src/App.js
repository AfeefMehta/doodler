import { useState, useEffect, useRef } from 'react'
import UserInfo from './components/UserInfo'
import socketClient from "socket.io-client";

let socket = socketClient("http://localhost:8000");

const Player = (props) => {
  return (
    <li>
      {props.name}
    </li>
  )
}

const PlayerInfo = ({ username, players }) => {
  return (
    <div className="component players-info">
      <h3 className="heading">Player List</h3>
      <p>Your username is <b>{username}</b></p>
      <ol id="player-list"></ol>
      { players.map(player => <Player key={player} name={player} />) }
    </div>
  )
}

const Message = ({ message }) => {
  return (
    <li>
      <b>{message}</b>
    </li>
  )
}

const Chatroom = ({ chat, message, handleMessage, handleMessageSubmit }) => {
  return (
    <div className="component chatting-area" >
      <h3 className="heading">Chatroom</h3>
      <ul id="chat-history"></ul>
      { chat.map(message => <Message message={message} />) }
      <form onSubmit={handleMessageSubmit}>
        <input type="text" value={message} onChange={handleMessage}></input>
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

const Color = (props) => {
  return (
    <button id={props.color} onClick={props.handlePickColor}></button>
  )
}

const Word = (props) => {
  return (
    <button id={props.word} onClick={props.handlePickWord}>{props.word}</button>
  )
}

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

  let colors = ["red", "blue", "green", "yellow", "orange", "purple", "brown", "black", "white"]

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
      console.log(optionsRef.current.innerHTML)
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
    <div className="component full-canvas">
      <canvas id="canvas" ref={canvasRef} height="380" width="640" 
        onMouseDown={handleMouseDownPaint} onMouseMove={handleMouseMovePaint} onMouseOut={handleMouseOff} onMouseUp={handleMouseOff}>
      </canvas><br />
      <div id="color-picker">
        {
          colors.map(color => <Color key={color} color={color} handlePickColor={handlePickColor} />)
        }
      </div>
      <div className="option-picker" ref={optionsRef}>
        {
          words.map(word => <Word word={word} handlePickWord={handlePickWord} />)
        }
        { }
      </div>
      <div className="clock-area">
        <p id="clock">{timerStatement}</p>
      </div>
      <div className="choice-area">
        <p id="choice">{chosenStatement}</p>
      </div>
    </div>
  )
}

const App = () => {
  let [username, setUsername] = useState('')
  let [drawmode, setDrawmode] = useState(false)
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
      setDrawmode(true)
      socket.emit('store-username', {username: username})
    }
  }

  if (drawmode) {
    return (
      <>
        <PlayerInfo username={username} players={playerList} />
        <DrawingCanvas words={words} />
        <Chatroom chat={chatHistory} message={message} handleMessage={handleMessage} handleMessageSubmit={handleMessageSubmit} />
      </>
    )
  }
  return (
    <>
      <UserInfo handleSubmit={handleUsernameSubmit} handleUsername={handleUsername} username={username} />
    </>
  )
}

export default App;
