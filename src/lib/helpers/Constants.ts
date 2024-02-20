// data to store while dragging
export const DRAG_DATA_DRAGGABLE_TYPE = (type: string) => `application/draggable-type-${type}`

export const DATA_DRAGGABLE_COLUMN_ID = 'data-draggable-in-column-id'

export const CSS_CLASS_PLACEHOLDER_HIDDEN = '.placeholder-hidden'
export type KeyActions = 'IndexDown' | 'IndexUp' | 'DroppableIncrease' | 'DroppableDecrease'

export type KeyBindingMap = Record<'ArrowUp' | 'ArrowRight' | 'ArrowLeft' | 'ArrowDown', KeyActions>

// default mapping to vertical
export const verticalKeyMapping: KeyBindingMap = {
	ArrowUp: 'IndexDown',
	ArrowDown: 'IndexUp',
	ArrowLeft: 'DroppableDecrease',
	ArrowRight: 'DroppableIncrease',
}

export const horizontalKeyMapping: KeyBindingMap = {
	ArrowUp: 'DroppableDecrease',
	ArrowDown: 'DroppableIncrease',
	ArrowLeft: 'IndexDown',
	ArrowRight: 'IndexUp',
}
