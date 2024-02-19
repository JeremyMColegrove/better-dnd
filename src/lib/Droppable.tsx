import React, {useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/DOMUtils'
import useDragster from 'react-dragster'
import useRandomID from './helpers/randomId.hook'
import {DroppableContext} from './DroppableContext'
import {
	DRAG_DATA_DRAGGABLE_ID,
	DRAG_DATA_DRAGGABLE_TYPE,
	DRAG_DATA_FROM_COLUMN_ID,
	DRAG_DATA_FROM_INDEX,
	DRAG_DATA_TO_INDEX,
} from './helpers/Constants'

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
		provided: {placeholder?: React.ReactElement; droppableProps: any; [x: string]: any},
		snapshot: {isDraggingOver: boolean},
	) => React.ReactElement
	onDrop: (info: DropProps) => any
	droppableId: string
	accepts: string
	direction?: DroppableDirection
}

export const acceptsType = (event: React.DragEvent<HTMLDivElement>, accepts: string): boolean => {
	if (!accepts) return false
	const acceptables = accepts.split(' ')

	for (const acceptable of acceptables) {
		if (event.dataTransfer.types.includes(DRAG_DATA_DRAGGABLE_TYPE(acceptable))) {
			return true
		}
	}
	return false
}

// set default values here
function Droppable(props: Props) {
	const dragContext = useDragContext()
	const [draggingOver, setDraggingOver] = useState<boolean>(false)
	const myId = useRandomID()
	const currentDraggingOverTimeout = useRef<NodeJS.Timeout | undefined>()

	const prepareDrop = (e: React.DragEvent<HTMLDivElement>) => {
		const payloadId = e.dataTransfer.getData(DRAG_DATA_DRAGGABLE_ID)
		const fromColumnId = e.dataTransfer.getData(DRAG_DATA_FROM_COLUMN_ID)
		const fromIndex = parseInt(e.dataTransfer.getData(DRAG_DATA_FROM_INDEX))
		var toIndex = parseInt(e.dataTransfer.getData(DRAG_DATA_TO_INDEX))
		// recalculate div info
		if (!toIndex) {
			const info = DOMUtils.getVisiblePlaceholderInfo(e, myId, props.direction)
			toIndex = info.index
		}

		const to = {droppableId: props.droppableId, index: toIndex}
		const from = {droppableId: fromColumnId, index: fromIndex}
		setDraggingOver(false)
		props.onDrop({dragId: payloadId, to, from})
		dragContext.clearPlaceholders()
	}

	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		// if this droppable can not accept the draggable, exit
		if (!acceptsType(e, props.accepts)) return
		// we can accept this drop
		e.preventDefault()
		e.stopPropagation()
		// update context and say this droppable can accept the draggable, so onLeave events don't fire and think the draggable can not be dropped
		dragContext.droppableLastUpdated.current += 1
		// refresh the dragContext placeholderInfo so the correct draggable shows its placeholder
		dragContext.updateActivePlaceholder(e, myId, props.direction)
		// if we are not currently draggingOver, set to true
		if (!draggingOver) setDraggingOver(true)
		// make sure dragContext is updated
		if (!dragContext.isDroppable) {
			dragContext.setIsDroppable(true)
		}
	}

	const onDragLeave = (e: React.DragEvent<any>) => {
		// local dragging should be false
		setDraggingOver(false)
		const startTimeout = (time: number) => {
			// cancel existing timer if exists
			if (currentDraggingOverTimeout.current) {
				clearTimeout(currentDraggingOverTimeout.current)
				currentDraggingOverTimeout.current = undefined
			}
			// set timer to check if another droppable can accept the draggable
			currentDraggingOverTimeout.current = setTimeout(() => {
				// check if another droppable can accept the item
				if (time === dragContext.droppableLastUpdated.current) {
					// if nothing else can accept the draggable
					dragContext.setIsDroppable(false)
				}
			}, 100)
		}

		// if this droppable accepts the draggable, lets start our timer
		// the timer checks if another droppable can accept the draggable
		// this is to avoid flickering issues, since onDragLeave fires when dragging into a new droppable,
		// even if that droppable is on top of this droppable. This makes the event very unreliably, so we must wait
		// to see if another droppable (maybe this one) can accept the draggable before setting dragContext.setIsDroppable to false
		if (acceptsType(e, props.accepts)) {
			startTimeout(dragContext.droppableLastUpdated.current)
		}
	}

	// use custom dragster hook for better enter and exit event handling
	const watcherRef = useDragster({
		dragsterLeave: onDragLeave,
		dragsterDrop: prepareDrop,
	})

	return (
		<DroppableContext droppableId={myId} droppableName={props.droppableId}>
			{props.children(
				{
					droppableProps: {
						ref: watcherRef,
						onDragOver: onDragOver,
						id: myId,
						['aria-orientation']: props.direction,
						['role']: 'tree',
						accepts: props.accepts,
					},
					placeholder: dragContext.placeholderInfo.id === myId ? dragContext.placeholder : undefined,
				},
				{isDraggingOver: draggingOver},
			)}
		</DroppableContext>
	)
}

export default Droppable
