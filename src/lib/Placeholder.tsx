import React, {useEffect, useRef} from 'react'
import {useAppSelector} from './redux/hooks'
import {useDragContext} from './DragDropContext'
import {PlaceholderPositionState} from './redux/reducers/placeholderPositionStateReducer'

interface Props {
	id: string
}

function Placeholder(props: Props) {
	// memo this in the future
	const placeholderPosition = useAppSelector((state) => state.placeholderPosition)
	const dragContext = useDragContext()

	return placeholderPosition.id == props.id ? dragContext.placeholder : <></>
}

export default Placeholder
