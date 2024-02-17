import React, {useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/DOMUtils'
import useDragster from './helpers/Dragster.hook'
import useRandomID from './helpers/randomId.hook'
import {DroppableContext} from './DroppableContext'

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

export type DroppableDirection = 'horizontal' | 'vertical'

interface Props {
	children: (
		provided: {placeholder: React.ReactElement; droppableProps: any; [x: string]: any},
		snapshot: {isDraggingOver: boolean},
	) => React.ReactElement
	onDrop: (info: DropProps) => any
	droppableId: string
	accepts: string
	direction: DroppableDirection
}

function Droppable(props: Props) {
	const dragContext = useDragContext()
	const [draggingOver, setDraggingOver] = useState<boolean>(false)
	const myId = useRandomID()

	const prepareDrop = (e: React.DragEvent<HTMLDivElement>) => {
		const payloadId = e.dataTransfer.getData('application/draggable-id')
		const fromColumnId = e.dataTransfer.getData('application/draggable-from-columnid')
		const fromIndex = e.dataTransfer.getData('application/draggable-from-index')

		// recalculate div info
		const info = DOMUtils.getVisiblePlaceholderInfo(e, myId, props.direction)

		const to = {droppableId: props.droppableId, index: info.index}

		const from = {droppableId: fromColumnId, index: parseInt(fromIndex)}

		setDraggingOver(false)
		props.onDrop({dragId: payloadId, to, from})
		dragContext.clearPlaceholders()
	}

	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		// refresh the dragContext placeholderInfo so the correct draggable shows its placeholder
		dragContext.updateActivePlaceholder(e, myId, props.direction)
		if (!draggingOver) setDraggingOver(true)
	}

	//@ts-ignore
	const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		setDraggingOver(false)

		// check if it is a draggable from your column, if so, clear placeholders (otherwise was a draggable from another droppable)
		// if (acceptsType(e, props.accepts)) {
		// 	dragContext.clearPlaceholders()
		// }
	}

	// use custom dragster hook for better enter and exit event handling
	const {elementRef} = useDragster({
		dragsterLeave: onDragLeave,
		dragsterOver: onDragOver,
		dragsterDrop: prepareDrop,
		accepts: props.accepts,
	})

	return (
		<DroppableContext droppableId={myId} droppableName={props.droppableId}>
			{props.children(
				{
					droppableProps: {ref: elementRef},
					draggableProps: {columnId: myId, columnName: props.droppableId},
					placeholder: dragContext.placeholderInfo.visibleId === myId ? dragContext.placeholder : <></>,
				},
				{isDraggingOver: draggingOver},
			)}
		</DroppableContext>
	)
}

export default Droppable
