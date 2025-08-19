import { configureStore } from '@reduxjs/toolkit'
import { navigationSlice } from './navigation-slice'
import { uiSlice } from './ui-slice'
import { api } from '@api/api'
import type { AppCachedData, DataEngine, MetadataStore } from '@types'

export const createStore = (
    engine: DataEngine,
    metadataStore: MetadataStore,
    appChachedData: AppCachedData
) => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            navigation: navigationSlice.reducer,
            ui: uiSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { engine, metadataStore, appChachedData },
                },
            }).concat(api.middleware),
    })
}

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
