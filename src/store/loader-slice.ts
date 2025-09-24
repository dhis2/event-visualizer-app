import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface LoaderState {
    loadError: string
    isVisualizationLoading: boolean
}

export const initialState: LoaderState = {
    loadError: '',
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
            state.loadError = action.payload
        },
    },
    selectors: {
        getIsVisualizationLoading: (state) => state.isVisualizationLoading,
        getLoadError: (state) => state.loadError,
    },
})

export const { setIsVisualizationLoading, setLoadError } = loaderSlice.actions
export const { getIsVisualizationLoading, getLoadError } = loaderSlice.selectors
