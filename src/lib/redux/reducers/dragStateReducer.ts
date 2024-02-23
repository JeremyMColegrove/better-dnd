import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '../store'

export interface DragState {
	dragging: boolean
	id?: string
}

const initialState: DragState = {
	dragging: false,
}

const dragStateSlice = createSlice({
	name: 'drag-state',
	initialState,
	reducers: {
		startDrag: (state, action: PayloadAction<string>) => {
			return {dragging: true, id: action.payload}
		},
		stopDrag: () => {
			return initialState
		},
	},
})

export const {startDrag, stopDrag} = dragStateSlice.actions

export default dragStateSlice.reducer
