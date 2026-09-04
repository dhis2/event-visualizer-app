import { type EngineError, parseEngineError } from '@api/parse-engine-error'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface LoaderState {
    visualizationLoadError: EngineError | null
    isVisualizationLoading: boolean
}

export const initialState: LoaderState = {
    visualizationLoadError: null,
    isVisualizationLoading: false,
}

export const loaderSlice = createSlice({
    name: 'loader',
    initialState,
    reducers: {
        setIsVisualizationLoading: (state, action: PayloadAction<boolean>) => {
            state.isVisualizationLoading = action.payload
            if (action.payload) {
                state.visualizationLoadError = null
            }
        },
        setVisualizationLoadError: {
            reducer: (state, action: PayloadAction<EngineError>) => {
                state.visualizationLoadError = action.payload
            },
            prepare: (error: unknown) => ({
                payload: parseEngineError(error),
            }),
        },
        clearVisualizationLoadError: (state) => {
            state.visualizationLoadError = initialState.visualizationLoadError
        },
    },
    selectors: {
        getIsVisualizationLoading: (state) => state.isVisualizationLoading,
        getVisualizationLoadError: (state) => state.visualizationLoadError,
    },
})

export const {
    setIsVisualizationLoading,
    setVisualizationLoadError,
    clearVisualizationLoadError,
} = loaderSlice.actions
export const { getIsVisualizationLoading, getVisualizationLoadError } =
    loaderSlice.selectors
