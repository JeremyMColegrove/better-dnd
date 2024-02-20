import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import DOMUtils from './helpers/DOMUtils'
import {DroppableDirection} from './Droppable'

export interface PlaceholderInfo {
	id: string
	index: number
}

interface DragDropData {
	placeholder: React.ReactElement
	recalculatePlaceholder: (draggable: HTMLElement, type: string) => void
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
}

const DragContext = createContext<DragDropData | undefined>(undefined)

export const useDragContext = () => {
	const context = useContext(DragContext)
	if (!context) {
		throw new Error('useDragContext must be used within a DragDropContext')
	}

	return context
}

export const DragDropContext: React.FC<{
	children: React.ReactNode
	placeholder?: (draggable: HTMLElement, type: string) => React.ReactElement
}> = ({children, placeholder: __placeholder}) => {
	const [calculatedPlaceholder, setCalculatedPlaceholder] = useState<React.ReactElement>(<></>)
	const [placeholderInfo, setPlaceholderInfo] = useState<PlaceholderInfo>({index: -1, id: ''})
	const [isDroppable, setIsDroppable] = useState<boolean>(false)
	const droppableLastUpdated = useRef<number>(0)
	const isDraggingDraggable = useRef<boolean>(false)
	const pointerPosition = useRef<{x: number; y: number}>({x: -1, y: -1})

	const value: DragDropData = {
		placeholder: calculatedPlaceholder,
		recalculatePlaceholder: (draggable: HTMLElement, type: string) =>
			setCalculatedPlaceholder(__placeholder ? __placeholder(draggable, type) : <></>),
		placeholderInfo: placeholderInfo,
		setPlaceholderInfo: (info: PlaceholderInfo) => setPlaceholderInfo(() => info),
		updateActivePlaceholder: (e: React.DragEvent<HTMLDivElement>, columnId: string, direction?: DroppableDirection) => {
			const info = DOMUtils.getVisiblePlaceholderInfo(e, columnId, direction)
			if (info.index === placeholderInfo.index && info.id === placeholderInfo.id) return
			setPlaceholderInfo(() => info)
		},
		clearPlaceholders: () => setPlaceholderInfo((prevInfo) => ({...prevInfo, id: ''})),
		isDroppable: isDroppable,
		setIsDroppable: setIsDroppable,
		droppableLastUpdated: droppableLastUpdated,
		isDraggingDraggable: isDraggingDraggable,
		pointerPosition: pointerPosition,
	}

	// always update the mouse pointer position during a drag
	useEffect(() => {
		const updatePointer = (e: React.DragEvent<any>) => {
			// console.log(e.clientX, e.clientY)
			pointerPosition.current = {x: e.clientX, y: e.clientY}
		}

		//@ts-ignore
		window.addEventListener('dragover', updatePointer)
		return () => {
			//@ts-ignore
			window.removeEventListener('dragover', updatePointer)
		}
	}, [])

	return <DragContext.Provider value={value}>{children}</DragContext.Provider>
}
