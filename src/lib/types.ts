export type DraggableType = {
	key: string
	value?: string
}

/**
 * The layout direction of the container.
 * @default vertical
 */
export type DroppableDirection = 'horizontal' | 'vertical'

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
