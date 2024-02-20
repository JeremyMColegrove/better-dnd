// data to store while dragging
export const DRAG_DATA_DRAGGABLE_TYPE = (type: string) => `application/draggable-type-${type}`
export const DATA_DRAGGABLE_COLUMN_ID = 'data-draggable-in-column-id'
export const CSS_CLASS_PLACEHOLDER_HIDDEN = '.placeholder-hidden'

export type DragActions = 'IndexDecrease' | 'IndexIncrease' | 'DroppableIncrease' | 'DroppableDecrease'
export type KeyBindingMap = Record<string, DragActions | boolean> & {
	ctrlKey: boolean
	shiftKey: boolean
}

// default mapping to vertical
export const defaultKeyboardAccessibilityMapping: KeyBindingMap = {
	ArrowUp: 'IndexDecrease',
	ArrowDown: 'IndexIncrease',
	ArrowLeft: 'DroppableDecrease',
	ArrowRight: 'DroppableIncrease',
	ctrlKey: false,
	shiftKey: true,
}
