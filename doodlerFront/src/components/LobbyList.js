import Lobby from './Lobby'

const LobbyList = ({ lobbyList, handleJoinLobby }) => {
  console.log(lobbyList)
  let lobbyNames = Object.keys(lobbyList)
  let lobbyID = 0
  return (
    <div className="lobbyList">
      {
        lobbyNames.map(lobbyName => {
          lobbyID++
          return (<Lobby lobbyName={lobbyName} handleJoinLobby={handleJoinLobby} key={lobbyID} />)
        })
      }
    </div>
  )
}

export default LobbyList