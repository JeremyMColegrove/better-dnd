import React, {startTransition, useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/utils'
import useRandomID from './helpers/randomId.hook'
import {useDroppableContext} from './DroppableContext'
import {DATA_DRAGGABLE_COLUMN_ID, DRAG_DATA_DRAGGABLE_TYPE, DragActions, defaultKeyboardAccessibilityMapping} from './Constants'
import {DraggableType} from './types'

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
	['aria-grabbed']: boolean
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
	 * The unique ID of this draggable. This will be passed into the onDrop function when the draggable is dropped.
	 * @see onDrop
	 */
	dragId: string
	/**
	 * The type of this draggable. Multiple types are supported.
	 * @example type={[{key:'task'}, {key:'text/plain', value:'This is some data I want to drop!'}]}
	 */
	types: DraggableType[]
	/**
	 * Can this draggable be dragged?
	 */
	disabled?: boolean
	/**
	 * Whether this draggable will have it's display hidden during drag (identified by aria-grabbed).
	 * This boolean ignores this element from the list when calculating drop position, and index.
	 * @default false
	 */
	hiddenDuringDrag?: boolean

	/**
	 * This tells the browser what kind of drag is happening, and may effect appearance of the drag.
	@see effectAllowed 
	*/
	dropEffect?: 'none' | 'copy' | 'link' | 'move'
	/**
	 * This restricts the types of drags that are available for this draggable. If a drag is attempted with a type that is not supported, it will fail.
	 * @default 'all'
	 * @alias effectAllowed
	 * @see dropEffect
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed MDN Reference}
	 */
	effectAllowed?: 'none' | 'copy' | 'link' | 'move' | 'copyLink' | 'copyMove' | 'linkMove' | 'all' | 'uninitialized'
}

function Draggable(props: Props) {
	const dragContext = useDragContext()
	const myId = useRandomID()
	const [dragging, setDragging] = useState<boolean>(false)
	const [localPlaceholder, setLocalPlaceholder] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(1)
	const childRef = useRef<HTMLElement>()
	const keyPressed = useRef<boolean>(false)

	const droppableContext = useDroppableContext()

	const onDragStart = (e: React.DragEvent<any>) => {
		e.stopPropagation()

		// check if it is a valid drag
		//first check if child directly has drag-handle class
		const target = e.target as HTMLElement
		var handle = undefined
		if (target.classList.contains('drag-handle')) {
			handle = childRef.current
		} else {
			handle = target.querySelector(`.drag-handle`)
		}
		//@ts-ignore
		const handleRect = handle.getBoundingClientRect()
		const valid =
			e.clientX >= handleRect.x &&
			e.clientX <= handleRect.x + handleRect.width &&
			e.clientY >= handleRect.y &&
			e.clientY <= handleRect.y + handleRect.height

		if (!valid) {
			e.preventDefault()
			return
		}

		if (dragging) return
		// re-calculate placeholder
		childRef.current && dragContext.recalculatePlaceholder(childRef.current, props.types)
		dragContext.isDraggingDraggable.current = true
		// pre-set the placeholder to the element below this one
		dragContext.hiddenDuringDrag.current = props.hiddenDuringDrag
		// id of the draggable being dragged
		// set previous droppable id
		if (droppableContext) {
			const indexOfItem = DOMUtils.getDOMElementsInDroppable(droppableContext.droppableId).findIndex((item) => item.id === myId)
			dragContext.dropProps.current = {dragId: props.dragId, from: {droppableId: droppableContext.droppableName, index: indexOfItem}}
		}

		for (var type of props.types) {
			e.dataTransfer.setData(type.key, type.value)
		}

		// set drag type
		e.dataTransfer.effectAllowed = props.effectAllowed ?? 'all'
		e.dataTransfer.dropEffect = props.dropEffect ?? 'copy'
		// e.dataTransfer.
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
		setDragging(false)
		setLocalPlaceholder(false)
		setRefresh((a) => a + 1)
		dragContext.clearPlaceholders()
		dragContext.isDraggingDraggable.current = false
		dragContext.setIsDroppable(false)
	}

	const onKeyUp = () => {
		keyPressed.current = false
	}

	// Handle Accesibility shortcuts
	const onKeyDown = (e: React.KeyboardEvent<any>) => {
		if (keyPressed.current || document.activeElement !== childRef.current) return

		// check if current key mapping has the key pressed
		// check shift and ctrl keys match mapped
		if (
			dragContext.keyBindMap.current[e.key] &&
			dragContext.keyBindMap.current.ctrlKey === e.ctrlKey &&
			dragContext.keyBindMap.current.shiftKey === e.shiftKey
		) {
			const droppableElement = document.getElementById(droppableContext.droppableId)
			var keyboardMapping = dragContext.keyBindMap.current

			const horizontalShift: Record<DragActions, DragActions> = {
				IndexIncrease: 'DroppableIncrease',
				IndexDecrease: 'DroppableDecrease',
				DroppableDecrease: 'IndexDecrease',
				DroppableIncrease: 'IndexIncrease',
			}

			e.preventDefault()
			keyPressed.current = true
			const action =
				droppableElement.ariaOrientation === 'horizontal' ? horizontalShift[keyboardMapping[e.key] as DragActions] : keyboardMapping[e.key]

			switch (action) {
				case 'IndexDecrease':
					shiftIndex(-1)
					break
				case 'IndexIncrease':
					shiftIndex(1)
					break
				case 'DroppableDecrease':
					shiftColumn(-1)
					break
				case 'DroppableIncrease':
					shiftColumn(1)
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
		const event = getDragEvent('drop', thisIndex, thisIndex + direction)
		droppableElement?.dispatchEvent(event)
	}

	const shiftColumn = (direction: 1 | -1) => {
		const itemsInThisColumn = DOMUtils.getDOMElementsInDroppable(droppableContext.droppableId)
		const thisIndex = itemsInThisColumn.findIndex((item) => item.id === myId)
		// get all of the other droppables in the dom
		var droppables = props.types.reduce((prev, next) => {
			return [...Array.from(DOMUtils.getDOMElementsWithKeyword('accepts', next.key)), ...prev]
		}, [])

		var myDroppablesIndex = droppables.findIndex((droppable) => droppable.id === droppableContext.droppableId)
		if (myDroppablesIndex + direction < 0 || myDroppablesIndex + direction >= droppables.length) return
		// get list of items in destination column
		var destinationItems = DOMUtils.getDOMElementsInDroppable(droppables[myDroppablesIndex + direction].id)
		const event = getDragEvent('drop', thisIndex, Math.min(thisIndex, destinationItems.length))
		droppables[myDroppablesIndex + direction].dispatchEvent(event)
	}

	const getDragEvent = (type: string, fromIndex: number, toIndex: number): DragEvent => {
		// update drag context drop props
		dragContext.dropProps.current = {
			dragId: props.dragId,
			from: {droppableId: droppableContext.droppableName, index: fromIndex},
			to: {index: toIndex},
		}
		// fire new event
		return new DragEvent(type, {
			bubbles: true,
			cancelable: true,
		})
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
						onDragStart: onDragStart,
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
						['aria-grabbed']: dragging,
					},
				},
				{isDragging: dragging, isDroppable: dragging && dragContext.isDroppable},
			)}
		</>
	)
}

export default Draggable
