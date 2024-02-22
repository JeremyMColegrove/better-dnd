import {createAction, createReducer, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '../store'
import {DraggableType, DroppableDirection} from '../../types'
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
		refreshPlaceholderPosition: (state, action: PayloadAction<PlaceholderRefreshProps>) => {
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
		resetPlaceholderPosition: (state) => {
			return initialState
		},
	},
})

export const {refreshPlaceholderPosition, resetPlaceholderPosition} = placeholderPositionSlice.actions

export const selectPlaceholder = (state: RootState) => state.placeholderPosition

export default placeholderPositionSlice.reducer
