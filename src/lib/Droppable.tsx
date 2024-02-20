import React, {useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import DOMUtils from './helpers/DOMUtils'
import useDragster, {DragsterOptions} from 'react-dragster'
import useRandomID from './helpers/randomId.hook'
import {DroppableContext} from './DroppableContext'
import {DRAG_DATA_DRAGGABLE_TYPE} from './helpers/Constants'

/**
 * Type of props during onDrop function
 */
export interface DropProps {
	/**
	 * The ID of the draggable that was dropped.
	 */
	dragId: string
	/**
	 * Information about the destination of the drop.
	 */
	to: {
		/**
		 * The ID of the droppable that the draggable is going to.
		 */
		droppableId: string
		/**
		 * The index where the draggable is trying to be placed.
		 */
		index: number
	}
	/**
	 * Information about where the draggable came from.
	 */
	from: {
		/**
		 * The ID of the droppable that the draggable came from.
		 */
		droppableId: string
		/**
		 * The index of the draggable in the previous droppable.
		 */
		index: number
	}
}

/**
 * The layout direction of the container.
 * @default vertical
 */
export type DroppableDirection = 'horizontal' | 'vertical'

interface Props {
	children: (
		provided: {placeholder?: React.ReactElement; droppableProps: any; [x: string]: any},
		snapshot: {isDraggingOver: boolean},
	) => React.ReactElement

	/**
	 * Whenever a draggable is dropped or being moved to this droppable container, this event fires with useful information.
	 * @example function onDrop(info: DropProps) { console.log(info) }
	 * @param info DropProps
	 * @returns void
	 */
	onDrop: (info: DropProps) => any
	/**
	 * The unique ID of the droppable which will be passed into onDrop
	 */
	droppableId: string
	/**
	 * This is the string names of draggable type this droppable will accept. It expects the types as a string, with multiple types being seperated by a space.
	 * @example accepts="tasks images"
	 */
	accepts: string
	/**
	 * The layout direction of the droppable, useful for keyboard accessibility.
	 * @default vertical
	 */
	direction?: DroppableDirection
	/**
	 * Enable enhanced scrolling on the droppable container.
	 * @default false
	 */
	enhancedScroll?: boolean
	/**
	 * A custom function to determine the scrolling speed of the div.
	 * @param distanceFromLeft the distance the mouse cursor is from the left edge of the droppable
	 * @param distanceFromRight the distance the mouse cursor is from the right edge of the droppable
	 * @default 3
	 * @returns number
	 */
	enhancedScrollSpeedX?: (distanceFromLeft: number, distanceFromRight: number) => number
	/**
	 * A custom function to determine the scrolling speed of the div.
	 * @param distanceFromTop the distance the mouse cursor is from the top edge of the droppable
	 * @param distanceFromBottom the distance the mouse cursor is from the bottom edge of the droppable
	 * @default 3
	 * @returns number
	 */
	enhancedScrollSpeedY?: (distanceFromTop: number, distanceFromBottom: number) => number
	/**
	 * Set distance from the edge to engage enhanced scroll.
	 * @default 50
	 */
	enhancedScrollDistance?: number
}

export const acceptsType = (event: React.DragEvent<any>, accepts: string): boolean => {
	if (!accepts) return false
	const acceptables = accepts.split(' ')

	for (const acceptable of acceptables) {
		if (event.dataTransfer.types.includes(DRAG_DATA_DRAGGABLE_TYPE(acceptable))) {
			return true
		}
	}
	return false
}

const defaultDropProp: DropProps = {
	dragId: undefined,
	from: {
		droppableId: undefined,
		index: undefined,
	},
	to: {
		droppableId: undefined,
		index: undefined,
	},
}

// set default values here
function Droppable(props: Props) {
	const dragContext = useDragContext()
	// if draggingOver this element (doesn't work for multiple layered droppables)
	const [draggingOver, setDraggingOver] = useState<boolean>(false)
	const myId = useRandomID()
	const currentDraggingOverTimeout = useRef<NodeJS.Timeout | undefined>()
	// updated position of pointer
	const animateScrollStarted = useRef<boolean>(false)

	// TESTING to test pointer in bounding box method
	const hoveringOver = useRef<boolean>(false)

	const prepareDrop = (e: React.DragEvent<any>) => {
		const dropProps = Object.assign(defaultDropProp, dragContext.dropProps.current)

		if (!dropProps.to.index) {
			dropProps.to.index = dragContext.placeholderInfo.index //DOMUtils.getVisiblePlaceholderInfo(e, myId, props.direction).index
		}

		// set to column to this column
		dropProps.to.droppableId = props.droppableId

		// overwrite default drop props with context drop props
		props.onDrop(dropProps)

		dragContext.clearPlaceholders()
		dragContext.dropProps.current = defaultDropProp
		if (draggingOver) {
			setDraggingOver(false)
		}
	}

	const onDragOver = (e: React.DragEvent<any>) => {
		// if this droppable can not accept the draggable, exit
		if (!acceptsType(e, props.accepts)) return
		// we can accept this drop, but don't call stopPropagation
		// allow it to continue up the tree to the window to fire ondragover and update mouse coords
		e.preventDefault()
		// update context and say this droppable can accept the draggable, so onLeave events don't fire and think the draggable can not be dropped
		dragContext.droppableLastUpdated.current += 1
		// refresh the dragContext placeholderInfo so the correct draggable shows its placeholder
		dragContext.updateActivePlaceholder(e, myId, props.direction)
		// if we are not currently draggingOver, set to true
		if (!draggingOver) {
			setDraggingOver(true)
		}
		// make sure dragContext is updated
		if (!dragContext.isDroppable) {
			dragContext.setIsDroppable(true)
		}
	}

	const onDragLeave = (e: React.DragEvent<any>) => {
		// local dragging should be false
		setDraggingOver(false)
		// reset the drag scroll listeners
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

		// check if pointer is outside of boundaries, it is no longer over this element
		if (!watcherRef.current || !props.enhancedScroll) return
		const rect = watcherRef.current.getBoundingClientRect()
		// there are false events here, we have to manually check if it is outside of the div
		if (
			e.clientX <= rect.left ||
			e.clientX >= rect.left + watcherRef.current.clientWidth ||
			e.clientY <= rect.top ||
			e.clientY >= rect.top + watcherRef.current.clientHeight
		) {
			// outside of div position, turn off hovering
			hoveringOver.current = false
		}
	}

	const animateScroll = () => {
		if (!watcherRef.current || !dragContext.isDraggingDraggable.current || !hoveringOver.current || !props.enhancedScroll) {
			animateScrollStarted.current = false // exiting loop, turn off this
			return
		}
		animateScrollStarted.current = true

		// Calculate the distance from the item to the edges
		const distanceFromTop = dragContext.pointerPosition.current.y - watcherRef.current.getBoundingClientRect().top
		const distanceFromBottom = watcherRef.current.clientHeight - distanceFromTop
		const distanceFromLeft = dragContext.pointerPosition.current.x - watcherRef.current.getBoundingClientRect().left
		const distanceFromRight = watcherRef.current.clientWidth - distanceFromLeft

		// Adjust scroll speed based on the distance
		var scrollSpeedY = props.enhancedScrollSpeedY?.(distanceFromTop, distanceFromBottom) || 3
		var scrollSpeedX = props.enhancedScrollSpeedX?.(distanceFromLeft, distanceFromRight) || 3

		var distance = props.enhancedScrollDistance || 50
		// check if should scroll Y
		if (distanceFromTop < distance) {
			watcherRef.current.scrollTop -= scrollSpeedY
		}
		// Scroll down if close to the bottom edge
		else if (distanceFromBottom < distance) {
			watcherRef.current.scrollTop += scrollSpeedY
		}

		// check if should scroll X
		if (distanceFromLeft < distance) {
			watcherRef.current.scrollLeft -= scrollSpeedX
		}
		// Scroll down if close to the bottom edge
		else if (distanceFromRight < distance) {
			watcherRef.current.scrollLeft += scrollSpeedX
		}

		requestAnimationFrame(animateScroll)
	}

	const onDragEnter = () => {
		hoveringOver.current = true
		if (!animateScrollStarted.current || !props.enhancedScroll) {
			requestAnimationFrame(animateScroll)
		}
	}

	useEffect(() => {
		if (!animateScrollStarted.current || !props.enhancedScroll) {
			requestAnimationFrame(animateScroll)
		}
	}, [dragContext.isDraggingDraggable.current])

	// use custom dragster hook for better enter and exit event handling
	const watcherRef = useDragster({
		dragsterLeave: onDragLeave,
		dragsterEnter: onDragEnter,
		dragsterDrop: prepareDrop,
	})

	return (
		<DroppableContext droppableId={myId} droppableName={props.droppableId}>
			{props.children(
				{
					droppableProps: {
						ref: watcherRef,
						onDragOver: onDragOver,
						onPointerEnter: () => (hoveringOver.current = true),
						onPointerLeave: () => (hoveringOver.current = false),
						onScroll: (e) => e.preventDefault(),
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
