import {configureStore} from '@reduxjs/toolkit'
import placeholderPositionSlice from './reducers/placeholderPositionStateReducer'
import dragStateSlice from './reducers/dragStateReducer'

export const store = configureStore({
	reducer: {
		placeholderPosition: placeholderPositionSlice,
		dragState: dragStateSlice,
	},
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
