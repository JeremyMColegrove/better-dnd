import React, {createContext, useContext, useState} from 'react'
import DOMUtils from './DOMUtils'

export interface PlaceholderInfo {
	visibleId: string
	index: number
}

interface DragDropData {
	placeholder: React.ReactElement
	recalculatePlaceholder: (draggable: HTMLElement, type: string) => void
	placeholderInfo: PlaceholderInfo
	setPlaceholderInfo: (info: PlaceholderInfo) => void
	updateActivePlaceholder: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void
	clearPlaceholders: () => void
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
	const [placeholderInfo, setPlaceholderInfo] = useState<PlaceholderInfo>({index: -1, visibleId: ''})

	const value: DragDropData = {
		placeholder: calculatedPlaceholder,
		recalculatePlaceholder: (draggable: HTMLElement, type: string) =>
			setCalculatedPlaceholder(__placeholder ? __placeholder(draggable, type) : <></>),
		placeholderInfo: placeholderInfo,
		setPlaceholderInfo: (info: PlaceholderInfo) => setPlaceholderInfo((old) => info),
		updateActivePlaceholder: (e: React.DragEvent<HTMLDivElement>, columnId: string) =>
			setPlaceholderInfo(() => DOMUtils.getVisiblePlaceholderInfo(e, columnId)),
		clearPlaceholders: () => setPlaceholderInfo((prevInfo) => ({...prevInfo, visibleId: ''})),
	}

	return <DragContext.Provider value={value}>{children}</DragContext.Provider>
}
