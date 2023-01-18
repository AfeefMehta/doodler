import Message from './Message'

const Chatroom = ({ chat, message, handleMessage, handleMessageSubmit }) => {
    let messageID = 0
  
    return (
      <div className="component chatting-area" >
        <h3 className="heading">Chatroom</h3>
        <ul id="chat-history"></ul>
        { chat.map(message => 
          {
            messageID++
            return (<Message key={messageID} message={message} />)
          }) 
        }
        <form onSubmit={handleMessageSubmit}>
          <input type="text" value={message} onChange={handleMessage}></input>
          <button type="submit">Send</button>
        </form>
      </div>
    )
}

export default Chatroom