const NewLobbyForm = ({ handleLobbyName, handleLobbyNumWords, handleLobbyRoundTime, handleCreateLobby }) => {
  return (
    <div className="lobbyForm text">
      <p>Enter Lobby Name:</p>
      <p>Number of word options for drawer:</p>
      <p>Time per drawer:</p>
      <input type="text" onChange={handleLobbyName}></input>
      <input type="number" max="4" min="1" onChange={handleLobbyNumWords} placeholder="3"></input>
      <input type="number" max="300" min="5" onChange={handleLobbyRoundTime} placeholder="60"></input>
      <button className="lobbySubmit" onClick={handleCreateLobby}>Create</button>
    </div>
  )
}

export default NewLobbyForm