import { configureStore } from '@reduxjs/toolkit'
import { currentVisSlice } from './current-vis-slice'
import { dimensionSelectionSlice } from './dimensions-selection-slice'
import { loaderSlice } from './loader-slice'
import { listenerMiddleware } from './middleware-listener'
import { navigationSlice } from './navigation-slice'
import { savedVisSlice } from './saved-vis-slice'
import { uiSlice } from './ui-slice'
import { visUiConfigSlice } from './vis-ui-config-slice'
import { api } from '@api/api'
import { getDefaultOptions } from '@modules/options'
import type { AppCachedData, DataEngine, MetadataStore } from '@types'

export const getPreloadedState = (appCachedData: AppCachedData) => ({
    visUiConfig: {
        ...visUiConfigSlice.getInitialState(),
        options: getDefaultOptions(
            appCachedData.systemSettings.digitGroupSeparator
        ),
    },
})

export const createStore = (
    engine: DataEngine,
    metadataStore: MetadataStore,
    appCachedData: AppCachedData
) =>
    configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            [currentVisSlice.name]: currentVisSlice.reducer,
            [dimensionSelectionSlice.name]: dimensionSelectionSlice.reducer,
            [loaderSlice.name]: loaderSlice.reducer,
            [navigationSlice.name]: navigationSlice.reducer,
            [uiSlice.name]: uiSlice.reducer,
            [visUiConfigSlice.name]: visUiConfigSlice.reducer,
            [savedVisSlice.name]: savedVisSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { engine, metadataStore, appCachedData },
                },
            })
                .prepend(listenerMiddleware.middleware)
                .concat(api.middleware),
        preloadedState: getPreloadedState(appCachedData),
    })

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
