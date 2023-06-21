import Player from './Player'

const PlayerInfo = ({ username, players }) => {
  return (
    <div className="players-info text">
      <h3>Player List</h3>
      <p>Your username is <b>{username}</b></p>
      <ul id="player-list">
        { players.map(player => <Player key={player} name={player} />) }
      </ul>
    </div>
  )
}

export default PlayerInfo