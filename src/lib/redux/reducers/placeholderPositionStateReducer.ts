import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {DroppableDirection} from '../../types'
import DOMUtils from '../../helpers/utils'

export interface PlaceholderPositionState {
	id?: string
	index?: number
}

interface PlaceholderRefreshProps {
	clientX: number
	clientY: number
	columnId: string
	direction: DroppableDirection
	ignoreDraggable: boolean
}

const initialState: PlaceholderPositionState = {}

const placeholderPositionSlice = createSlice({
	name: 'placeholder/position',
	initialState,
	reducers: {
		updatePlaceholderPosition: (state, action: PayloadAction<PlaceholderRefreshProps>) => {
			const newState = DOMUtils.updatePlaceholderPosition(
				action.payload.clientX,
				action.payload.clientY,
				action.payload.columnId,
				action.payload.direction,
				action.payload.ignoreDraggable,
			)

			// if nothing has changed, ignore it
			if (newState.id !== state.id || newState.index !== state.index) {
				return newState
			}

			return state
		},
		resetPlaceholderPosition: () => {
			return initialState
		},
	},
})

export const {updatePlaceholderPosition, resetPlaceholderPosition} = placeholderPositionSlice.actions

export default placeholderPositionSlice.reducer
