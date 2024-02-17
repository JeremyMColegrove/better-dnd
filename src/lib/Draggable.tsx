import React, {startTransition, useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/DOMUtils'
import useRandomID from './helpers/randomId.hook'
import {useDroppableContext} from './DroppableContext'

interface DraggableProps {}

interface DragHandleProps {}

interface SnapshotProps {
	dragging: boolean
	currentDroppableID: string
	currentDroppableName: string
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

		// id of the draggable
		e.dataTransfer.setData('application/draggable-id', props.dragId)

		// set previous droppable id
		e.dataTransfer.setData('application/draggable-from-columnid', droppableContext.droppableName)

		const indexOfItem = DOMUtils.getIndexOfItem(droppableContext.droppableId, myId)

		// set previous droppable index
		e.dataTransfer.setData('application/draggable-from-index', indexOfItem.toString())

		if (props.type) {
			e.dataTransfer.setData(`application/draggable-for-${props.type}`, 'true')
		}
	}

	// we should not use onDragStart here, because styles get updated in column on drag over, so there is glitch that happens for second
	const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
		if (!dragging) {
			setDragging(true)
		}
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
	}

	useEffect(() => {
		setLocalPlaceholder(false)
	}, [dragContext.placeholderInfo.visibleId])

	return (
		<>
			{(dragContext.placeholderInfo.visibleId === myId || localPlaceholder) && dragContext.placeholder}
			{props.children(
				{
					draggableProps: {
						draggable: props.disabled ? false : true,
						onDragStart: initDrag,
						onDrag: onDrag,
						onDragEnd: onDrop,
						ref: childRef,
						key: refresh,
						['data-columnid']: droppableContext.droppableId,
						id: myId,
					},
					dragHandle: {
						onMouseDown: () => (canDrag.current = true),
						onMouseUp: () => (canDrag.current = false),
					},
				},
				{dragging: dragging, currentDroppableID: droppableContext.droppableId, currentDroppableName: droppableContext.droppableName},
			)}
		</>
	)
}

export default Draggable
