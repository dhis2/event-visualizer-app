import { configureStore } from '@reduxjs/toolkit'
import { currentVisSlice } from './current-vis-slice'
import { listenerMiddleware } from './middleware/listener'
import { navigationSlice } from './navigation-slice'
import { savedVisSlice } from './saved-vis-slice'
import { uiSlice } from './ui-slice'
import { api } from '@api/api'
import type { AppCachedData, DataEngine, MetadataStore } from '@types'

export const createStore = (
    engine: DataEngine,
    metadataStore: MetadataStore,
    appCachedData: AppCachedData
) => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            currentVis: currentVisSlice.reducer,
            navigation: navigationSlice.reducer,
            ui: uiSlice.reducer,
            savedVis: savedVisSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { engine, metadataStore, appCachedData },
                },
            })
                .prepend(listenerMiddleware.middleware)
                .concat(api.middleware),
    })
}

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
