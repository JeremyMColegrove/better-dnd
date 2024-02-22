import {createAction, createReducer, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '../store'

const assignPlaceholder = createAction('placeholder/assign')

interface PlaceholderState {
	value: number
}

const initialState: PlaceholderState = {value: 0}

// export const placeholderReducer = createReducer(initialState, (builder) => {
// 	builder.addCase(assignPlaceholder, (state, action) => {
// 		state.value = action.payload
// 	})
// })

const placeholderSlice = createSlice({
	name: 'placeholder',
	initialState,
	reducers: {
		increment: (state) => {
			state.value += 1
		},
		decrement: (state) => {
			state.value -= 1
		},
		// Use the PayloadAction type to declare the contents of `action.payload`
		incrementByAmount: (state, action: PayloadAction<number>) => {
			state.value += action.payload
		},
	},
})

export const {increment, decrement, incrementByAmount} = placeholderSlice.actions

export const selectPlaceholder = (state: RootState) => state.placeholder.value

export default placeholderSlice.reducer
