const UserInfo = ({ handleSubmit, handleUsername, username}) => {
    return (
        <div id="home-component" className="text">
            <img src={require("../assets/pencil.png")} />

            <h1>Doodler.io</h1>
            <p>A game where you draw stuff and your friends guess it!</p><br />
            
            <form onSubmit={handleSubmit}>
                <input className="text" type="text" value={username} onChange={handleUsername}></input>
                <button className="text" type="submit" >Enter Name</button>
            </form>
        </div>
    )
}

export default UserInfo