import { configureStore, ReducersMapObject } from '@reduxjs/toolkit'
import type { RootState } from '@types'

export const setupStore = (
    reducer: Partial<ReducersMapObject<RootState>>,
    preloadedState: Partial<RootState>
): {
    getState: () => Partial<RootState>
    dispatch: ReturnType<typeof configureStore>['dispatch']
    subscribe: ReturnType<typeof configureStore>['subscribe']
    replaceReducer: ReturnType<typeof configureStore>['replaceReducer']
} => {
    return configureStore({
        reducer: reducer as ReducersMapObject<RootState>,
        preloadedState,
    })
}
