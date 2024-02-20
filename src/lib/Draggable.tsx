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
	DRAG_DATA_TO_INDEX,
	horizontalKeyMapping,
	verticalKeyMapping,
} from './helpers/Constants'

type DragEventFunction = (e: React.DragEvent<any>) => any
type KeyEventFunction = (e: React.KeyboardEvent<any>) => any

/**
 * These props should be spread onto the draggable element.
 * @example {(provided, snapshot)=><div {...provided.draggableProps}.../>
 */
interface DraggableProps {
	draggable: boolean
	onDragStart: DragEventFunction | any
	onDrag: DragEventFunction | any
	onDragEnd: DragEventFunction | any
	onKeyDown: KeyEventFunction | any
	onKeyUp: KeyEventFunction | any
	ref: React.MutableRefObject<any>
	key: number
	[DATA_DRAGGABLE_COLUMN_ID]: string
	id: string
	tabIndex: number
	role: string
}

/**
 * This should be spread on whatever element you want to use as the drag handle.
 * @example {(provided, snapshot)=><div {...provided.draggableProps}><div {...provided.dragHandle}></div></div>
 */
interface DragHandleProps {
	onPointerDown: () => void
	onPointerUp: () => void
}

/**
 * Provides information about the current state of the draggable during its drag.
 */
interface Snapshot {
	/**
	 * Is the current draggable being dragged?
	 */
	isDragging: boolean
	/**
	 * Is the current draggable able to dropped in a valid container?
	 */
	isDroppable: boolean
}

/**
 * Provides spreadable props to spread onto its children to enable functionality.
 * @see DraggableProps
 * @see DragHandleProps
 */
interface Provided {
	/**
	 * Spread this prop on the child you want to enable drag functionality.
	 */
	draggableProps: DraggableProps
	/**
	 * Spread this prop on the element you want to use as the drag handle.
	 */
	dragHandle: DragHandleProps
}

interface Props {
	/**
	 *
	 * @param provided Provided
	 * @param snapshot Snapshot
	 * @returns React.ReactElement
	 */
	children: (provided: Provided, snapshot: Snapshot) => React.ReactElement
	/**
	 * Can this draggable be dragged?
	 */
	disabled?: boolean
	/**
	 * The unique ID of this draggable. This will be passed into the onDrop function when the draggable is dropped.
	 * @see onDrop
	 */
	dragId: string
	/**
	 * The type of this draggable. Multiple types are not supported.
	 * @example type="task"
	 */
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
	const keyPressed = useRef<boolean>(false)

	const droppableContext = useDroppableContext()

	const initDrag = (e: React.DragEvent<HTMLElement>) => {
		if (!canDrag.current) {
			e.preventDefault()
		}

		e.stopPropagation()
		if (dragging) return
		// re-calculate placeholder
		childRef.current && dragContext.recalculatePlaceholder(childRef.current, props.type)
		dragContext.isDraggingDraggable.current = true
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
	const onDrag = (e: React.DragEvent<any>) => {
		e.stopPropagation()
		if (!dragging) {
			setDragging(true)
		}
	}

	const onDrop = (e: React.DragEvent<any>) => {
		e.stopPropagation()

		startTransition(() => {
			setDragging(false)
			setLocalPlaceholder(false)
			setRefresh((a) => a + 1)
		})

		canDrag.current = false
		dragContext.clearPlaceholders()
		dragContext.isDraggingDraggable.current = false
		dragContext.setIsDroppable(false)
	}

	// Handle Accesibility shortcuts
	const onKeyDown = (e: React.KeyboardEvent<any>) => {
		if (keyPressed.current || document.activeElement !== childRef.current) return

		if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			const droppableElement = document.getElementById(droppableContext.droppableId)
			var keyboardMapping = droppableElement?.ariaOrientation === 'horizontal' ? horizontalKeyMapping : verticalKeyMapping

			e.preventDefault()
			keyPressed.current = true
			//@ts-ignore
			switch (keyboardMapping[e.key]) {
				case 'IndexDown':
					shiftIndex(-1)
					break
				case 'IndexUp':
					shiftIndex(1)
					break
				case 'DroppableDecrease':
					shiftColumns(-1)
					break
				case 'DroppableIncrease':
					shiftColumns(1)
					break
				default:
					break
			}
		}
	}

	const shiftIndex = (direction: 1 | -1) => {
		const itemsInThisColumn = DOMUtils.getDOMElementsInDroppable(droppableContext.droppableId)
		const thisIndex = itemsInThisColumn.findIndex((item) => item.id === myId)
		if (thisIndex + direction < 0 || thisIndex + direction >= itemsInThisColumn.length) return
		const droppableElement = document.getElementById(droppableContext.droppableId)
		const event = getDragEvent(thisIndex, thisIndex + direction)
		droppableElement?.dispatchEvent(event)
	}

	const shiftColumns = (direction: 1 | -1) => {
		const itemsInThisColumn = DOMUtils.getDOMElementsInDroppable(droppableContext.droppableId)
		const thisIndex = itemsInThisColumn.findIndex((item) => item.id === myId)
		// get all of the other droppables in the dom
		var droppables = Array.from(DOMUtils.getDOMElementsWithKeyword('accepts', props.type))
		var myDroppablesIndex = droppables.findIndex((droppable) => droppable.id === droppableContext.droppableId)
		if (myDroppablesIndex + direction < 0 || myDroppablesIndex + direction >= droppables.length) return
		// get list of items in destination column
		var destinationItems = DOMUtils.getDOMElementsInDroppable(droppables[myDroppablesIndex + direction].id)
		const event = getDragEvent(thisIndex, Math.min(thisIndex, destinationItems.length))
		droppables[myDroppablesIndex + direction].dispatchEvent(event)
	}

	const getDragEvent = (fromIndex: number, toIndex: number): DragEvent => {
		const dataTransfer = new DataTransfer()
		dataTransfer.setData(DRAG_DATA_DRAGGABLE_ID, props.dragId)
		dataTransfer.setData(DRAG_DATA_FROM_INDEX, fromIndex.toString())
		dataTransfer.setData(DRAG_DATA_FROM_COLUMN_ID, droppableContext.droppableName)
		dataTransfer.setData(DRAG_DATA_TO_INDEX, toIndex.toString())
		return new DragEvent('drop', {
			bubbles: true,
			cancelable: true,
			dataTransfer: dataTransfer,
		})
	}

	const onKeyUp = () => {
		keyPressed.current = false
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
						onKeyDown: onKeyDown,
						onKeyUp: onKeyUp,
						ref: childRef,
						key: refresh,
						[DATA_DRAGGABLE_COLUMN_ID]: droppableContext.droppableId,
						id: myId,
						tabIndex: 0,
						role: 'treeitem',
					},
					dragHandle: {
						onPointerDown: () => (canDrag.current = true),
						onPointerUp: () => (canDrag.current = false),
					},
				},
				{isDragging: dragging, isDroppable: dragging && dragContext.isDroppable},
			)}
		</>
	)
}

export default Draggable
