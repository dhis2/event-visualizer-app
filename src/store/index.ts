import { configureStore } from '@reduxjs/toolkit'
import type { AppCachedData, DataEngine, MetadataStore } from '@types'
import { api } from '../api'
import { navigationReducer } from './navigation-slice'
import { uiReducer } from './ui-slice'

export const createStore = (
    engine: DataEngine,
    metadataStore: MetadataStore,
    appChachedData: AppCachedData
) => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            navigation: navigationReducer,
            ui: uiReducer,
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

export * from './navigation-slice'
export * from './ui-slice'
