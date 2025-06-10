import { configureStore } from '@reduxjs/toolkit/react'
import { dynamicMiddleware } from './middleware/dynamic'
import { api } from './services/api'

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(api.middleware)
            .concat(dynamicMiddleware.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
