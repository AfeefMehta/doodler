import { useState } from 'react'
import UserInfo from './components/UserInfo'
import socketClient from "socket.io-client";

const App = () => {
  let [username, setUsername] = useState('')
  let [drawmode, setDrawmode] = useState(false)

  let handleUsername = (event) => {
    setUsername(event.target.value)
  }
  let handleSubmit = (event) => {
    event.preventDefault()
    if (username === '') {
      window.alert("The username must contain at least 1 character")
    } else {
      let socket = socketClient("http://localhost:8000");
      console.log(socket)
      setDrawmode(true)
    }
  }

  if (drawmode) {
    return (<>Now in draw mode</>)
    // return (
    //   <>
    //     <div class="component players-info" >
    //       <h3 class="heading">Player List</h3>
    //       <p>Your username is <b><%= username %></b></p>
    //       <ol id="player-list"></ol>
    //     </div>

    //     <div class="component full-canvas">
    //       <div class="choice-area">
    //         <p id="choice"></p>
    //       </div>
    //       <canvas id="canvas" height="380" width="640"></canvas><br>
    //       <div id="color-picker">
    //         <button id="red"></button>
    //         <button id="blue"></button>
    //         <button id="green"></button>
    //         <button id="yellow"></button>
    //         <button id="orange"></button>
    //         <button id="purple"></button>
    //         <button id="brown"></button>
    //         <button id="black"></button>
    //         <button id="white"></button>
    //       </div>
    //       <div class="option-picker">
    //         <button id="option-one"><%= words[0] %></button>
    //         <button id="option-two"><%= words[1] %></button>
    //         <button id="option-three"><%= words[2] %></button>
    //       </div>
    //       <div class="clock-area">
    //         <p id="clock"></p>
    //       </div>
    //     </div>

    //     <div class="component chatting-area" >
    //       <h3 class="heading">Chatroom</h3>
    //       <ul id="chat-history"></ul>
    //       <label for="message">Enter message: </label>
    //       <input id="message" name="message" type="text">
    //       <button id="submit-message">Send message</button>
    //     </div>
    //   </>
    // )
  }
  return (
    <>
      <UserInfo handleSubmit={handleSubmit} handleUsername={handleUsername} username={username} />
    </>
  )
}

export default App;
