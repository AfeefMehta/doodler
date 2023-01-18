import Player from './Player'

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

export default PlayerInfo