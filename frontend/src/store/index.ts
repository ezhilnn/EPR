import { configureStore } from '@reduxjs/toolkit'
import billsReducer from './slices/billsSlice'

export const store = configureStore({
  reducer: {
    bills: billsReducer,
  },
})

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch