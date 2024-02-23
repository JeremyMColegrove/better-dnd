import {configureStore} from '@reduxjs/toolkit'
import placeholderPositionState from './reducers/placeholderReducer'
import draggingReducer from './reducers/draggingReducer'

export const store = configureStore({
	reducer: {
		placeholderPosition: placeholderPositionState,
		draggingState: draggingReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
