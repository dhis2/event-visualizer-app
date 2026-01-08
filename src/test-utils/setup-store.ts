import type { ReducersMapObject } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@types'

export const setupStore = (
    reducer: Partial<ReducersMapObject<RootState>>,
    preloadedState?: Partial<RootState>
) => {
    return configureStore({
        reducer: reducer as ReducersMapObject<RootState>,
        preloadedState,
    })
}
