import React, {useEffect, useRef, useState} from 'react'
import {useDragContext} from './DragDropContext'
import Utils from './helpers/utils'
import useDragster, {DragsterOptions} from 'react-dragster'
import useRandomID from './helpers/randomId.hook'
import {DroppableContext} from './DroppableContext'
import {DRAG_DATA_DRAGGABLE_TYPE} from './Constants'
import {DropProps, DroppableDirection} from './types'
import {useAppSelector, useAppDispatch} from './redux/hooks'
import DOMUtils from './helpers/utils'
import {updatePlaceholderPosition, resetPlaceholderPosition} from './redux/reducers/placeholderPositionStateReducer'
import schedule from 'raf-schd'

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
	accepts: string[]
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
	 * @default Expontial (min 1 max 10)
	 * @returns number
	 */
	enhancedScrollSpeedX?: (distanceFromEdge: number) => number
	/**
	 * A custom function to determine the scrolling speed of the div.
	 * @param distanceFromTop the distance the mouse cursor is from the top edge of the droppable
	 * @param distanceFromBottom the distance the mouse cursor is from the bottom edge of the droppable
	 * @default 3
	 * @returns number
	 */
	enhancedScrollSpeedY?: (distanceFromEdge: number) => number
	/**
	 * Set distance from the edge to engage enhanced scroll.
	 * @default 75
	 */
	enhancedScrollDistance?: number
}

export const acceptsTypes = (event: React.DragEvent<any>, acceptables: string[]): boolean => {
	for (const acceptable of acceptables) {
		if (acceptable.trim() != '' && event.dataTransfer.types.includes(DRAG_DATA_DRAGGABLE_TYPE(acceptable))) {
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
	//@ts-ignore
	const placeholderPosition = useAppSelector(
		(state) => state.placeholderPosition,
		(oldState, state) => {
			if ((oldState?.id == myId && state?.id != myId) || (oldState?.id != myId && state?.id == myId)) {
				return false
			}
			return true
		},
	)
	// redux state
	const dispatch = useAppDispatch()
	// const placeholderPosition = useAppSelector((state) => state.placeholderPosition)

	const onDrop = (e: React.DragEvent<any>) => {
		const dropProps = Object.assign(defaultDropProp, dragContext.dropProps.current)

		if (dropProps.to.index == undefined || dropProps.to.index == -1) {
			dropProps.to.index = DOMUtils.updatePlaceholderPosition(e.clientX, e.clientY, myId, props.direction).index
		}

		// set to column to this column
		dropProps.to.droppableId = props.droppableId

		dispatch(resetPlaceholderPosition())
		dragContext.dropProps.current = defaultDropProp
		if (draggingOver) {
			setDraggingOver(false)
		}

		// we probably want to call this, and then on next state update, actually cancel drop and remove placeholder
		props.onDrop(dropProps)
	}

	const onDragOver = (e: React.DragEvent<any>) => {
		// if this droppable can not accept the draggable, exit
		if (!acceptsTypes(e, props.accepts)) return

		// we can accept this drop, but don't call stopPropagation
		// allow it to continue up the tree to the window to fire ondragover and update mouse coords
		e.preventDefault()
		// update context and say this droppable can accept the draggable, so onLeave events don't fire and think the draggable can not be dropped
		dragContext.droppableLastUpdated.current += 1
		// refresh the dragContext placeholderInfo so the correct draggable shows its placeholder
		dispatch(
			updatePlaceholderPosition({
				clientX: e.clientX,
				clientY: e.clientY,
				columnId: myId,
				direction: props.direction,
			}),
		)
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
		if (acceptsTypes(e, props.accepts)) {
			startTimeout(dragContext.droppableLastUpdated.current)
		}

		// check if pointer is outside of boundaries, it is no longer over this element
		if (!watcherRef.current || !props.enhancedScroll) return

		const rect = watcherRef.current.getBoundingClientRect()
		// there are false events here, we have to manually check if it is outside of the div
		if (
			e.clientX <= rect.x ||
			e.clientX >= rect.x + watcherRef.current.clientWidth ||
			e.clientY <= rect.y ||
			e.clientY >= rect.y + watcherRef.current.clientHeight
		) {
			// outside of div position, turn off hovering
			hoveringOver.current = false
		}
	}

	const exponentialScroll = (distanceFromEdge: number): number => {
		// take the distance to the edge and then compute the resulting scroll speed
		// const dist = 10 - (distanceFromEdge * distanceFromEdge) / 625
		return 1 + distanceFromEdge * distanceFromEdge * 10
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

		var distance = props.enhancedScrollDistance || 75
		// Adjust scroll speed based on the distance
		const distanceY = 1 - Math.min(distanceFromTop, distanceFromBottom) / distance
		const distanceX = 1 - Math.min(distanceFromLeft, distanceFromRight) / distance

		var scrollSpeedX = props.enhancedScrollSpeedX?.(distanceX) || exponentialScroll(distanceX)
		var scrollSpeedY = props.enhancedScrollSpeedY?.(distanceY) || exponentialScroll(distanceY)

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

		schedule(animateScroll)()
	}
	const scheduleAnimateScroll = schedule(animateScroll)

	const onDragEnter = () => {
		hoveringOver.current = true
		if (!animateScrollStarted.current) {
			scheduleAnimateScroll()
		}
	}

	useEffect(() => {
		if (!animateScrollStarted.current) {
			scheduleAnimateScroll()
		}
	}, [dragContext.isDraggingDraggable.current])

	// use custom dragster hook for better enter and exit event handling
	const watcherRef = useDragster({
		dragsterLeave: onDragLeave,
		dragsterEnter: onDragEnter,
		dragsterDrop: onDrop,
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
						id: myId,
						['aria-orientation']: props.direction,
						['role']: 'tree',
						accepts: props.accepts,
					},
					placeholder: placeholderPosition.id === myId ? dragContext.placeholder : undefined,
				},
				{isDraggingOver: draggingOver},
			)}
		</DroppableContext>
	)
}

export default Droppable
