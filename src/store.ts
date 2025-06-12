import { configureStore } from '@reduxjs/toolkit/react'
import { dynamicMiddleware } from './middleware/dynamic'
import { api } from './services/api'

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore meta.engine, we know it's non-serializable
                ignoredActionPaths: ['meta.baseQueryMeta.extra.engine'],
            },
        })
            .concat(dynamicMiddleware.middleware)
            .concat(api.middleware),
    devTools: true,
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
