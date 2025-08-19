import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { SupportedVisType } from '@constants/visualization-types'

export interface UiState {
    visualizationType: SupportedVisType
}

export const initialState: UiState = {
    visualizationType: 'LINE_LIST',
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setUiState: (
            state,
            action: PayloadAction<{
                visualizationType: SupportedVisType | 'LINE_LIST'
            }>
        ) => {
            state.visualizationType = action.payload.visualizationType
        },
    },
})

export const { setUiState } = uiSlice.actions
