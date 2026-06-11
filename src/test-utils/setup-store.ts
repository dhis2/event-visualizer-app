import type { ReducersMapObject, UnknownAction } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@types'

export const setupStore = (
    reducer: Partial<ReducersMapObject<RootState>>,
    preloadedState?: Partial<RootState>
) => {
    return configureStore({
        // PreloadedState pinned to Partial<RootState> to match what
        // configureStore infers from `preloadedState` under strict mode.
        reducer: reducer as ReducersMapObject<
            RootState,
            UnknownAction,
            Partial<RootState>
        >,
        preloadedState,
    })
}
