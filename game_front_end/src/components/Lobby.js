const Lobby = ({ lobbyName, handleJoinLobby }) => {
    return (
      <div className="lobby">
        {lobbyName}
        <button className="lobbyJoin" id={lobbyName} onClick={handleJoinLobby}>Join</button>
      </div>
    )
  }

export default Lobby