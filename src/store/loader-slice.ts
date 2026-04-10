import { type EngineError, parseEngineError } from '@api/parse-engine-error'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface LoaderState {
    loadError: EngineError | null
    isVisualizationLoading: boolean
}

export const initialState: LoaderState = {
    loadError: null,
    isVisualizationLoading: false,
}

export const loaderSlice = createSlice({
    name: 'loader',
    initialState,
    reducers: {
        setIsVisualizationLoading: (state, action: PayloadAction<boolean>) => {
            state.isVisualizationLoading = action.payload
            if (action.payload) {
                state.loadError = null
            }
        },
        setLoadError: {
            reducer: (state, action: PayloadAction<EngineError>) => {
                state.loadError = action.payload
            },
            prepare: (error: unknown) => ({
                payload: parseEngineError(error),
            }),
        },
        clearLoadError: (state) => {
            state.loadError = initialState.loadError
        },
    },
    selectors: {
        getIsVisualizationLoading: (state) => state.isVisualizationLoading,
        getLoadError: (state) => state.loadError,
    },
})

export const { setIsVisualizationLoading, setLoadError, clearLoadError } =
    loaderSlice.actions
export const { getIsVisualizationLoading, getLoadError } = loaderSlice.selectors
