import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import DOMUtils from './helpers/utils'
import {KeyBindingMap, defaultKeyboardAccessibilityMapping} from './Constants'
import {DraggableType, DropProps, DroppableDirection} from './types'
import {Provider} from 'react-redux'
import {store} from './redux/store'

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>
}

interface DragDropData {
	placeholder: React.ReactElement
	recalculatePlaceholder: (draggable: HTMLElement, types: DraggableType[]) => void
	isDroppable: boolean
	setIsDroppable: React.Dispatch<React.SetStateAction<boolean>>
	droppableLastUpdated: React.MutableRefObject<number>
	isDraggingDraggable: React.MutableRefObject<boolean>
	pointerPosition: React.MutableRefObject<{
		x: number
		y: number
	}>
	dropProps: React.MutableRefObject<RecursivePartial<DropProps>>
	keyBindMap: React.MutableRefObject<KeyBindingMap>
}

const DragContext = createContext<DragDropData | undefined>(undefined)

export const useDragContext = () => {
	const context = useContext(DragContext)
	if (!context) {
		throw new Error('useDragContext must be used within a DragDropContext')
	}

	return context
}

interface DragDropContextProps {
	children: React.ReactNode
	placeholder?: (draggable: HTMLElement, types: string[]) => React.ReactElement
	keyBindMap?: KeyBindingMap
}

export const DragDropContext = (props: DragDropContextProps) => {
	const [calculatedPlaceholder, setCalculatedPlaceholder] = useState<React.ReactElement>(<></>)

	const [isDroppable, setIsDroppable] = useState<boolean>(false)
	const droppableLastUpdated = useRef<number>(0)
	const isDraggingDraggable = useRef<boolean>(false)
	const pointerPosition = useRef<{x: number; y: number}>({x: -1, y: -1})
	const dropProps = useRef<RecursivePartial<DropProps>>({})
	const keyBindMap = useRef<KeyBindingMap>(props.keyBindMap || defaultKeyboardAccessibilityMapping)

	const value: DragDropData = {
		placeholder: calculatedPlaceholder,
		recalculatePlaceholder: (draggable: HTMLElement, types: DraggableType[]) =>
			setCalculatedPlaceholder(
				props.placeholder ? (
					props.placeholder(
						draggable,
						types.flatMap((t) => t.key),
					)
				) : (
					<></>
				),
			),

		isDroppable: isDroppable,
		setIsDroppable: setIsDroppable,

		droppableLastUpdated: droppableLastUpdated,
		isDraggingDraggable: isDraggingDraggable,
		pointerPosition: pointerPosition,
		dropProps: dropProps,
		keyBindMap: keyBindMap,
	}

	// always update the mouse pointer position during a drag
	useEffect(() => {
		const updatePointer = (e: React.DragEvent<any>) => {
			pointerPosition.current = {x: e.clientX, y: e.clientY}
		}

		//@ts-ignore
		window.addEventListener('dragover', updatePointer)
		return () => {
			//@ts-ignore
			window.removeEventListener('dragover', updatePointer)
		}
	}, [])

	return (
		<Provider store={store}>
			<DragContext.Provider value={value}>
				{Math.random() * 999}
				{props.children}
			</DragContext.Provider>
		</Provider>
	)
}
