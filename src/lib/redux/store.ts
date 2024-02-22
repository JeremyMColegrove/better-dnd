import {configureStore} from '@reduxjs/toolkit'
import placeholderSlice from './reducers/placeholderReducer'

export const store = configureStore({
	reducer: {
		placeholder: placeholderSlice,
	},
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
