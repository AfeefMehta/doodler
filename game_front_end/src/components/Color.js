const Color = (props) => {
    return (
      <button id={props.color} onClick={props.handlePickColor}></button>
    )
}

export default Color