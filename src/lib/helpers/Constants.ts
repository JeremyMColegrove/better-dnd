// data to store while dragging
export const DRAG_DATA_DRAGGABLE_ID = 'application/draggable-id'
export const DRAG_DATA_DRAGGABLE_TYPE = (type: string) => `application/draggable-type-${type}`
export const DRAG_DATA_FROM_COLUMN_ID = 'application/draggable-from-columnid'
export const DRAG_DATA_FROM_INDEX = 'application/draggable-from-index'
export const DRAG_DATA_TO_INDEX = 'application/draggable-to-index'

export const DATA_DRAGGABLE_COLUMN_ID = 'data-draggable-in-column-id'

export const CSS_CLASS_PLACEHOLDER_HIDDEN = '.placeholder-hidden'
export const SCROLL_HOVER_EVENT = 'rbdd:watch-scroll'
export const SCROLL_CHANGE_EVENT = 'rbdd:change-scroll'
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
