import React, {useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './DOMUtils'
import useDragster from './Dragster.hook'

export interface DropProps {
	dragId: string
	to: {
		droppableId: string
		index: number
	}
	from: {
		droppableId: string
		index: number
	}
}

export interface DraggableProps {
	columnId: string
}

interface Props {
	children: (
		provided: {draggableProps: DraggableProps; placeholder: React.ReactElement; droppableProps: any; [x: string]: any},
		snapshot: {isDraggingOver: boolean},
	) => React.ReactElement
	onDrop: (info: DropProps) => any
	droppableId: string
	accepts: string
}

function Droppable(props: Props) {
	const dragContext = useDragContext()
	const [draggingOver, setDraggingOver] = useState<boolean>(false)

	const prepareDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		const payloadId = e.dataTransfer.getData('application/draggable-id')
		const fromColumnId = e.dataTransfer.getData('application/draggable-from-columnid')
		const fromIndex = e.dataTransfer.getData('application/draggable-from-index')

		// recalculate div info
		const info = DOMUtils.getVisiblePlaceholderInfo(e, props.droppableId)

		const to = {droppableId: props.droppableId, index: info.index}

		const from = {droppableId: fromColumnId, index: parseInt(fromIndex)}

		setDraggingOver(false)
		props.onDrop({dragId: payloadId, to, from})
		dragContext.clearPlaceholders()
	}

	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		// refresh the dragContext placeholderInfo so the correct draggable shows its placeholder
		dragContext.updateActivePlaceholder(e, props.droppableId)
		if (!draggingOver) setDraggingOver(true)
	}

	const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		setDraggingOver(false)
		dragContext.clearPlaceholders()
	}

	// use custom dragster hook for better enter and exit event handling
	const {elementRef} = useDragster({
		dragsterLeave: onDragLeave,
		dragsterOver: onDragOver,
		dragsterDrop: prepareDrop,
		accepts: props.accepts,
	})

	return props.children(
		{
			droppableProps: {ref: elementRef},
			draggableProps: {columnId: props.droppableId},
			placeholder: dragContext.placeholderInfo.visibleId === props.droppableId ? dragContext.placeholder : <></>,
		},
		{isDraggingOver: draggingOver},
	)
}

export default Droppable
