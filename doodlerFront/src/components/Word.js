const Word = (props) => {
    return (
      <button id={props.word} onClick={props.handlePickWord}>{props.word}</button>
    )
}

export default Word