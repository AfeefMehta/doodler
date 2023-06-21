import Message from './Message'

const Chatroom = ({ chat, message, handleMessage, handleMessageSubmit }) => {
    let messageID = 0
  
    return (
      <div className="chatting-area text" >
        <h3>Chatroom</h3>
        <ul id="chat-history">
          { chat.map(message => 
            {
              messageID++
              return (<Message key={messageID} counter={messageID} message={message} />)
            }) 
          }
        </ul>
        <form onSubmit={handleMessageSubmit}>
          <input className="text" type="text" value={message} onChange={handleMessage}></input>
          <button className="text" type="submit">Send</button>
        </form>
      </div>
    )
}

export default Chatroom