import {CSS_CLASS_PLACEHOLDER_HIDDEN, DATA_DRAGGABLE_COLUMN_ID} from '../Constants'
import {PlaceholderPositionState} from '../redux/reducers/placeholderPositionStateReducer'
import {DroppableDirection} from '../types'

export default class DOMUtils {
	constructor() {}

	static getDOMElementsInDroppable = (columnId: string, extraFilters?: string): Element[] => {
		return Array.from(document.querySelectorAll(`[${DATA_DRAGGABLE_COLUMN_ID}="${columnId}"]${extraFilters ? extraFilters : ''}`))
	}

	static getDOMElementsWithKeyword = (attribute: string, word: string) => {
		return document.querySelectorAll(
			`[${attribute}~=" ${word} "], [${attribute}^="${word} "], [${attribute}$=" ${word}"], [${attribute}="${word}"]`,
		)
	}

	static updatePlaceholderPosition = (
		clientX: number,
		clientY: number,
		columnId: string,
		direction?: DroppableDirection,
		ignoreDraggable?: boolean,
	): PlaceholderPositionState => {
		// here we get all of our tasks in the specific column, and figure out which tasks placeholder we should display (top or bottom)
		// get all draggables in column, and provide CSS class as an extra filter
		const draggables = this.getDOMElementsInDroppable(
			columnId,
			`${ignoreDraggable ? ':not([aria-grabbed="true"])' : ''}:not(${CSS_CLASS_PLACEHOLDER_HIDDEN})`,
		)
		// calculate the closest item below us to place a placeholder on. If above, ignore.
		const closest = draggables.reduce(
			(closest, child, index) => {
				const box = child.getBoundingClientRect()
				var distance = -1
				// default to vertical checking
				if (direction == 'horizontal') {
					distance = clientX - (box.right + box.left) / 2
				} else {
					distance = clientY - (box.top + box.bottom) / 2
				}

				if (distance < 0 && distance > closest.offset) {
					return {offset: distance, element: child, index: index}
				}
				return closest
			},
			{
				offset: Number.NEGATIVE_INFINITY,
				element: draggables[draggables.length - 1],
				index: draggables.length,
			},
		)

		// check if should return columnId (very bottom or empty droppable placeholder)
		if (!closest.element || (closest.index === draggables.length && closest.offset === Number.NEGATIVE_INFINITY)) {
			return {id: columnId, index: closest.index}
		}

		// check if the id should be that of the droppable
		return {id: closest.element.id, index: closest.index}
	}
}
