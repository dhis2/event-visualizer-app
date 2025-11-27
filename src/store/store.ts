import { configureStore } from '@reduxjs/toolkit'
import { currentVisSlice } from './current-vis-slice'
import { loaderSlice } from './loader-slice'
import { listenerMiddleware } from './middleware-listener'
import { navigationSlice } from './navigation-slice'
import { savedVisSlice } from './saved-vis-slice'
import { uiSlice } from './ui-slice'
import { visUiConfigSlice } from './vis-ui-config-slice'
import { api } from '@api/api'
import { getDefaultOptions } from '@modules/options'
import type { AppCachedData, DataEngine, MetadataStore } from '@types'

export const createStore = (
    engine: DataEngine,
    metadataStore: MetadataStore,
    appCachedData: AppCachedData
) =>
    configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            currentVis: currentVisSlice.reducer,
            loader: loaderSlice.reducer,
            navigation: navigationSlice.reducer,
            ui: uiSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
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
        preloadedState: {
            visUiConfig: {
                ...visUiConfigSlice.getInitialState(),
                options: getDefaultOptions(
                    appCachedData.currentUser.settings.digitGroupSeparator
                ),
            },
        },
    })

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
