import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import DOMUtils from './helpers/utils'
import {KeyBindingMap, defaultKeyboardAccessibilityMapping} from './Constants'
import {DraggableType, DropProps, DroppableDirection} from './types'
import {Provider} from 'react-redux'
import {store} from './redux/store'

export interface PlaceholderInfo {
	id: string
	index: number
}

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>
}

interface DragDropData {
	placeholder: React.ReactElement
	recalculatePlaceholder: (draggable: HTMLElement, types: DraggableType[]) => void
	placeholderInfo: PlaceholderInfo
	setPlaceholderInfo: (info: PlaceholderInfo) => void
	updateActivePlaceholder: (e: React.DragEvent<HTMLDivElement>, columnId: string, direction?: DroppableDirection) => void
	clearPlaceholders: () => void
	isDroppable: boolean
	setIsDroppable: React.Dispatch<React.SetStateAction<boolean>>
	droppableLastUpdated: React.MutableRefObject<number>
	isDraggingDraggable: React.MutableRefObject<boolean>
	pointerPosition: React.MutableRefObject<{
		x: number
		y: number
	}>
	dropProps: React.MutableRefObject<RecursivePartial<DropProps>>
	hiddenDuringDrag: React.MutableRefObject<boolean>
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

	const [placeholderInfo, setPlaceholderInfo] = useState<PlaceholderInfo>({index: -1, id: ''})
	const [isDroppable, setIsDroppable] = useState<boolean>(false)
	const droppableLastUpdated = useRef<number>(0)
	const isDraggingDraggable = useRef<boolean>(false)
	const pointerPosition = useRef<{x: number; y: number}>({x: -1, y: -1})
	const dropProps = useRef<RecursivePartial<DropProps>>({})
	const hiddenDuringDrag = useRef<boolean>(false)
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
		placeholderInfo: placeholderInfo,
		setPlaceholderInfo: (info: PlaceholderInfo) => setPlaceholderInfo(() => info),
		updateActivePlaceholder: (e: React.DragEvent<any>, columnId: string, direction?: DroppableDirection) => {
			const info = DOMUtils.getVisiblePlaceholderInfo(e, columnId, direction, hiddenDuringDrag.current)
			if (info.index === placeholderInfo.index && info.id === placeholderInfo.id) return
			setPlaceholderInfo(info)
		},
		clearPlaceholders: () => setPlaceholderInfo((prevInfo) => ({...prevInfo, id: ''})),
		isDroppable: isDroppable,
		setIsDroppable: setIsDroppable,

		droppableLastUpdated: droppableLastUpdated,
		isDraggingDraggable: isDraggingDraggable,
		pointerPosition: pointerPosition,
		dropProps: dropProps,
		hiddenDuringDrag: hiddenDuringDrag,
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
