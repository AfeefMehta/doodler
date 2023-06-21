const Message = ({ counter, message }) => {
  let backgroundColor = 'lighter'
  if (counter % 2 === 0) {
    backgroundColor = 'darker'
  }

  return (
    <li className={backgroundColor}>
      <b>{message}</b>
    </li>
  )
}

export default Message
