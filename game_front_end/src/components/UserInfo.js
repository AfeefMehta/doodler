const UserInfo = ({ handleSubmit, handleUsername, username}) => {
    return (
        <>
            <h1>Welcome to PAINTER.IO</h1>
            <p>A game where you draw stuff and your friends guess it!</p><br />

            <form onSubmit={handleSubmit}>
                <input type="text" value={username} onChange={handleUsername}></input>
                <button type="submit">Start game</button>
            </form>
        </>
    )
}

export default UserInfo