import { useState } from 'react'
import UserInfo from './components/UserInfo'

const App = () => {
  let [username, setUsername] = useState('')

  let handleUsername = (event) => {
    setUsername(event.target.value)
  }
  let handleSubmit = (event) => {
    event.preventDefault()
    console.log(username)
    setUsername('')
  }

  return (
    <>
      <UserInfo handleSubmit={handleSubmit} handleUsername={handleUsername} username={username} />
    </>
  )
}

export default App;
