import React, {startTransition, useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/DOMUtils'
import useRandomID from './helpers/randomId.hook'
import {useDroppableContext} from './DroppableContext'
import {
	DATA_DRAGGABLE_COLUMN_ID,
	DRAG_DATA_DRAGGABLE_ID,
	DRAG_DATA_DRAGGABLE_TYPE,
	DRAG_DATA_FROM_COLUMN_ID,
	DRAG_DATA_FROM_INDEX,
} from './helpers/Constants'

type DragEventFunction = (e: React.DragEvent<any>) => any
// type GenericFunction = (...args: any[]) => any

interface DraggableProps {
	draggable: boolean
	onDragStart: DragEventFunction | any
	onDrag: DragEventFunction | any
	onDragEnd: DragEventFunction | any
	ref: React.MutableRefObject<any>
	key: number
	[DATA_DRAGGABLE_COLUMN_ID]: string
	id: string
	tabIndex: number
}

interface DragHandleProps {}

interface SnapshotProps {
	isDragging: boolean
	isDroppable: boolean
}

interface Props {
	children: (provided: {draggableProps: DraggableProps; dragHandle: DragHandleProps}, snapshot: SnapshotProps) => React.ReactElement
	disabled?: boolean
	dragId: string
	type: string
}

function Draggable(props: Props) {
	const dragContext = useDragContext()
	const myId = useRandomID()
	const [dragging, setDragging] = useState<boolean>(false)
	const [localPlaceholder, setLocalPlaceholder] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(1)
	const childRef = useRef<HTMLElement>()
	const canDrag = useRef<boolean>(false)

	const droppableContext = useDroppableContext()

	const initDrag = (e: React.DragEvent<HTMLElement>) => {
		if (!canDrag.current) {
			e.preventDefault()
		}

		e.stopPropagation()
		if (dragging) return
		// re-calculate placeholder
		childRef.current && dragContext.recalculatePlaceholder(childRef.current, props.type)
		// pre-set the placeholder to the element below this one
		// id of the draggable being dragged
		e.dataTransfer.setData(DRAG_DATA_DRAGGABLE_ID, props.dragId)
		// set previous droppable id
		if (droppableContext) {
			e.dataTransfer.setData(DRAG_DATA_FROM_COLUMN_ID, droppableContext.droppableName)
			const indexOfItem = DOMUtils.getIndexOfItem(droppableContext.droppableId, myId)
			// set previous droppable index
			e.dataTransfer.setData(DRAG_DATA_FROM_INDEX, indexOfItem.toString())
		}

		if (props.type) {
			e.dataTransfer.setData(DRAG_DATA_DRAGGABLE_TYPE(props.type), 'true')
		}
	}

	// we should not use onDragStart here, because styles get updated in column on drag over, so there is glitch that happens for second
	const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
		if (!dragging) {
			setDragging(true)
		}

		// check if can drop
		e.stopPropagation()
	}

	const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
		startTransition(() => {
			setDragging(false)
			setLocalPlaceholder(false)
			setRefresh((a) => a + 1)
		})

		canDrag.current = false
		e.stopPropagation()
		dragContext.clearPlaceholders()
		dragContext.setIsDroppable(false)
	}

	useEffect(() => {
		setLocalPlaceholder(false)
	}, [dragContext.placeholderInfo.id])

	useEffect(() => {
		if (dragging && !dragContext.isDroppable) {
			dragContext.clearPlaceholders()
		}
	}, [dragContext.isDroppable])

	return (
		<>
			{(dragContext.placeholderInfo.id === myId || localPlaceholder) && dragContext.placeholder}
			{props.children(
				{
					draggableProps: {
						draggable: props.disabled ? false : true,
						onDragStart: initDrag,
						onDrag: onDrag,
						onDragEnd: onDrop,
						ref: childRef,
						key: refresh,
						[DATA_DRAGGABLE_COLUMN_ID]: droppableContext.droppableId,
						id: myId,
						tabIndex: 0,
					},
					dragHandle: {
						onMouseDown: () => (canDrag.current = true),
						onMouseUp: () => (canDrag.current = false),
					},
				},
				{isDragging: dragging, isDroppable: dragging && dragContext.isDroppable},
			)}
		</>
	)
}

export default Draggable
