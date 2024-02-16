import {PlaceholderInfo} from './DragDropContext'

export default class DOMUtils {
	constructor() {}

	static getIndexOfItem = (columnId: string, itemId: string) => {
		// find the index of specific item in this column
		const draggables = Array.from(document.querySelectorAll(`[data-columnid="${columnId}"]`))
		return draggables.findIndex((d) => d.id === itemId)
	}

	static getVisiblePlaceholderInfo = (e: React.DragEvent<HTMLDivElement>, columnId: string): PlaceholderInfo => {
		// here we get all of our tasks in the specific column, and figure out which tasks placeholder we should display (top or bottom)
		// get all draggables in column
		const draggables = Array.from(document.querySelectorAll(`[data-columnid="${columnId}"]:not([style*="display: none"])`))

		// now we figure it out! Woohoo
		const closest = draggables.reduce(
			(closest, child, index) => {
				const box = child.getBoundingClientRect()
				const offset = e.clientY - (box.top + box.bottom) / 2

				if (offset < 0 && offset > closest.offset) {
					return {offset: offset, element: child, index: index}
				} else {
					return closest
				}
			},
			{
				offset: Number.NEGATIVE_INFINITY,
				element: draggables[draggables.length - 1],
				index: draggables.length,
			},
		)

		console.log(closest)

		// check if should return columnId (very bottom or empty droppable placeholder)
		if (!closest.element || (closest.index === draggables.length && closest.offset === Number.NEGATIVE_INFINITY)) {
			return {visibleId: columnId, index: closest.index}
		}

		// check if the id should be that of the droppable
		return {visibleId: closest.element.id, index: closest.index}
	}
}
