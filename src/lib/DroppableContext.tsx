import React, {createContext, useContext} from 'react'

interface DroppableContextProps {
	droppableId: string
	droppableName: string
}

const DropContext = createContext<DroppableContextProps | undefined>(undefined)

export const useDroppableContext = () => {
	const context = useContext(DropContext)
	if (!context) {
		throw new Error('useDragContext must be used within a DragDropContext')
	}
	return context
}

export const DroppableContext: React.FC<{children: React.ReactNode; droppableId: string; droppableName: string}> = ({
	children,
	droppableId,
	droppableName,
}) => {
	return (
		<DropContext.Provider
			value={{
				droppableId,
				droppableName,
			}}>
			{Math.random() * 999}
			{children}
		</DropContext.Provider>
	)
}
