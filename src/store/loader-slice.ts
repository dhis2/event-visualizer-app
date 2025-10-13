import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { type EngineError, parseEngineError } from '@api/parse-engine-error'

export interface LoaderState {
    loadError: EngineError
    isVisualizationLoading: boolean
}

export const initialState: LoaderState = {
    loadError: {
        type: 'unknown',
        message: '',
    },
    isVisualizationLoading: false,
}

export const loaderSlice = createSlice({
    name: 'loader',
    initialState,
    reducers: {
        setIsVisualizationLoading: (state, action: PayloadAction<boolean>) => {
            state.isVisualizationLoading = action.payload
        },
        setLoadError: (state, action: PayloadAction<string>) => {
            state.loadError = parseEngineError(action.payload)
        },
    },
    selectors: {
        getIsVisualizationLoading: (state) => state.isVisualizationLoading,
        getLoadError: (state) => state.loadError,
    },
})

export const { setIsVisualizationLoading, setLoadError } = loaderSlice.actions
export const { getIsVisualizationLoading, getLoadError } = loaderSlice.selectors
