import React, {useEffect, useRef} from 'react'
import {useAppSelector} from './redux/hooks'
import {useDragContext} from './DragDropContext'
import {PlaceholderPositionState} from './redux/reducers/placeholderReducer'

interface Props {
	id: string
	refresh: () => void
}

function Placeholder(props: Props) {
	// memo this in the future
	const placeholderPosition = useAppSelector((state) => state.placeholderPosition)
	const dragContext = useDragContext()
	const previousPlaceholderPosition = useRef<PlaceholderPositionState>()

	useEffect(() => {
		// check if stuff has changed, and called refresh
		if (
			previousPlaceholderPosition.current?.id !== placeholderPosition.id &&
			(previousPlaceholderPosition.current?.id == props.id || placeholderPosition.id == props.id)
		) {
			props.refresh()
		}

		previousPlaceholderPosition.current = placeholderPosition
	}, [placeholderPosition])

	return placeholderPosition.id == props.id ? dragContext.placeholder : <></>
}

export default Placeholder
