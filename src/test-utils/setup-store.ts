import type { ReducersMapObject, UnknownAction } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@types'

export const setupStore = (
    reducer: Partial<ReducersMapObject<RootState>>,
    preloadedState?: Partial<RootState>
) => {
    return configureStore({
        /* configureStore infers the PreloadedState generic as Partial<RootState>
         * from `preloadedState`, so the reducer map's PreloadedState must match.
         * ReducersMapObject's default PreloadedState is the full RootState, which
         * trips strict reducer-variance checks — pin it to Partial<RootState>. */
        reducer: reducer as ReducersMapObject<
            RootState,
            UnknownAction,
            Partial<RootState>
        >,
        preloadedState,
    })
}
