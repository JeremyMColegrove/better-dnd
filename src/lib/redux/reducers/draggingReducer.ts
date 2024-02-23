import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '../store'

export interface DraggingState {
	dragging: boolean
	id?: string
}

const initialState: DraggingState = {
	dragging: false,
}

const draggingSlice = createSlice({
	name: 'dragging',
	initialState,
	reducers: {
		startDragging: (state, action: PayloadAction<string>) => {
			return {dragging: true, id: action.payload}
		},
		stopDragging: () => {
			return initialState
		},
	},
})

export const {startDragging, stopDragging} = draggingSlice.actions

export default draggingSlice.reducer
