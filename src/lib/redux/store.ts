import {configureStore} from '@reduxjs/toolkit'
import placeholderPositionSlice from './reducers/placeholderReducer'

export const store = configureStore({
	reducer: {
		placeholderPosition: placeholderPositionSlice,
	},
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
