import React, {useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './DOMUtils'

interface Props {
	children: (provided: {draggableProps: {[x: string]: any}}, snapshot: {isDragging: boolean}) => React.ReactElement
	disabled?: boolean
	draggableProps: {
		columnId: string
	}
	dragId: string
	type: string
}

function Draggable(props: Props) {
	const dragContext = useDragContext()

	const [dragging, setDragging] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(1)
	const childRef = useRef<HTMLElement>()

	const initDrag = (e: React.DragEvent<HTMLElement>) => {
		if (dragging) return

		// re-calculate placeholder
		childRef.current && dragContext.recalculatePlaceholder(childRef.current, props.type)

		// id of the draggable
		e.dataTransfer.setData('application/draggable-id', props.dragId)

		// set previous droppable id
		e.dataTransfer.setData('application/draggable-from-columnid', props.draggableProps.columnId)

		// set previous droppable index
		e.dataTransfer.setData('application/draggable-from-index', DOMUtils.getIndexOfItem(props.draggableProps.columnId, props.dragId).toString())

		if (props.type) {
			e.dataTransfer.setData(`application/draggable-for-${props.type}`, 'true')
		}
	}

	// we should not use onDragStart here, because styles get updated in column on drag over, so there is glitch that happens for second
	const onDrag = () => {
		if (!dragging) {
			setDragging(true)
		}
	}

	const onDrop = () => {
		setDragging(false)
		setRefresh((a) => a + 1)
	}

	const draggingStyle = {display: 'none'}

	return (
		<>
			{dragContext.placeholderInfo.visibleId === props.dragId && dragContext.placeholder}
			{props.children(
				{
					draggableProps: {
						draggable: props.disabled ? false : true,
						onDragStart: initDrag,
						onDrag: onDrag,
						onDragEnd: onDrop,
						style: dragging ? draggingStyle : {},
						ref: childRef,
						key: refresh,
						['data-columnid']: props.draggableProps.columnId,
						id: props.dragId,
					},
				},
				{isDragging: dragging},
			)}
		</>
	)
}

export default Draggable
