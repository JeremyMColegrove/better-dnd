import React, {PropsWithChildren, useEffect, useRef} from 'react'

interface Props {
	dragsterEnter?: (e: React.DragEvent<HTMLDivElement>) => any
	dragsterLeave?: (e: React.DragEvent<HTMLDivElement>) => any
	dragsterDrop?: (e: React.DragEvent<HTMLDivElement>) => any
	dragsterOver?: (e: React.DragEvent<HTMLDivElement>) => any
	accepts: string
	[x: string]: any
}

const Dragster = ({children, dragsterEnter, dragsterDrop, dragsterLeave, dragsterOver, accepts, ...others}: PropsWithChildren<Props>) => {
	const elementRef = useRef<React.ElementRef<'div'>>(null)
	let first = false
	let second = false

	const acceptsType = (event: React.DragEvent<HTMLDivElement>): boolean => {
		if (!accepts) return false
		var acceptables = accepts.split(' ')
		for (var acceptable of acceptables) {
			if (event.dataTransfer.types.includes(`application/draggable-for-${acceptable}`)) {
				return true
			}
		}
		return false
	}

	const dragenter = (event: React.DragEvent<HTMLDivElement>) => {
		event.stopPropagation()
		event.preventDefault()

		if (first) {
			second = true
		} else {
			first = true

			const enterEvent = new CustomEvent('dragsterEnter', {
				bubbles: true,
				cancelable: false,
				detail: {
					dataTransfer: event.dataTransfer,
					sourceEvent: event,
				},
			})
			elementRef.current?.dispatchEvent(enterEvent)
			dragsterEnter && dragsterEnter(event)
		}
	}

	const dragleave = (event: React.DragEvent<HTMLDivElement>) => {
		event.stopPropagation()
		event.preventDefault()

		if (second) {
			second = false
		} else if (first) {
			first = false
		}

		if (!first && !second) {
			const leaveEvent = new CustomEvent('dragsterLeave', {
				bubbles: true,
				cancelable: false,
				detail: {
					dataTransfer: event.dataTransfer,
					sourceEvent: event,
				},
			})
			elementRef.current?.dispatchEvent(leaveEvent)
			dragsterLeave && dragsterLeave(event)
		}
	}

	const drop = (event: React.DragEvent<HTMLDivElement>) => {
		event.stopPropagation()
		event.preventDefault()

		first = false
		second = false
		// dragleave(event)
		dragsterDrop && dragsterDrop(event)
	}

	const dragOver = (event: React.DragEvent<HTMLDivElement>) => {
		if (acceptsType(event)) {
			event.preventDefault()
			event.stopPropagation()
		}

		dragsterOver && dragsterOver(event)
	}

	useEffect(() => {
		const element = elementRef.current

		if (element) {
			//@ts-expect-error
			element.addEventListener('dragenter', dragenter)
			//@ts-expect-error
			element.addEventListener('dragleave', dragleave)
			// @ts-expect-error
			element.addEventListener('dragover', dragOver)
			//@ts-expect-error
			element.addEventListener('drop', drop)
		}

		return () => {
			// Cleanup: remove event listeners when the component is unmounted
			if (element) {
				//@ts-expect-error
				element.removeEventListener('dragenter', dragenter)
				//@ts-expect-error
				element.removeEventListener('dragleave', dragleave)
				//@ts-expect-error
				element.removeEventListener('dragover', dragOver)
				//@ts-expect-error
				element.removeEventListener('drop', drop)
			}
		}
	}, []) // Empty dependency array to run the effect only once on mount

	return (
		<div ref={elementRef} {...others}>
			{children}
		</div>
	)
}

export default Dragster
