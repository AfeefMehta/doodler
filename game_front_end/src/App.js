import { useState, useEffect } from 'react'
import UserInfo from './components/UserInfo'
import socketClient from "socket.io-client";

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

const DrawingCanvas = ({ words }) => {
  return (
    <div className="component full-canvas">
      <canvas id="canvas" height="380" width="640"></canvas><br />
      <div id="color-picker">
        <button id="red"></button>
        <button id="blue"></button>
        <button id="green"></button>
        <button id="yellow"></button>
        <button id="orange"></button>
        <button id="purple"></button>
        <button id="brown"></button>
        <button id="black"></button>
        <button id="white"></button>
      </div>
      <div className="option-picker">
        <button id="option-one">{words[0]}</button>
        <button id="option-two">{words[1]}</button>
        <button id="option-three">{words[2]}</button>
      </div>
      <div className="clock-area">
        <p id="clock"></p>
      </div>
      <div className="choice-area">
        <p id="choice"></p>
      </div>
    </div>
  )
}

const Chatroom = ({  }) => {
  return (
    <div className="component chatting-area" >
      <h3 className="heading">Chatroom</h3>
      <ul id="chat-history"></ul>
      <label for="message">Enter message: </label>
      <input id="message" name="message" type="text" />
      <button id="submit-message">Send message</button>
    </div>
  )
}

let socket = socketClient("http://localhost:8000");

const App = () => {
  let [username, setUsername] = useState('')
  let [drawmode, setDrawmode] = useState(false)
  let [words, setWords] = useState([])
  let [players, setPlayers] = useState([])

  useEffect(() => {
    socket.on('show-words', (data) => {
      handleWords(data.words)
    })

    socket.on('update-player-list', (data) => {
      handlePlayers(data.usernames)
    })

    return () => {
      socket.off('show-words')
    }
  }, [])

  let handlePlayers = (currentPlayers) => {
    setPlayers(currentPlayers)
  }
  let handleWords = (currentWords) => {
    setWords(currentWords)
  }
  let handleUsername = (event) => {
    setUsername(event.target.value)
  }
  let handleSubmit = (event) => {
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
        <PlayerInfo username={username} players={players} />
        {/* <DrawingCanvas words={words} /> */}
      </>
    )
  }
  return (
    <>
      <UserInfo handleSubmit={handleSubmit} handleUsername={handleUsername} username={username} />
    </>
  )
}

export default App;
