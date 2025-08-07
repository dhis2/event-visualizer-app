import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SupportedVisType } from '../constants'

interface UiState {
    visualizationType: SupportedVisType
}

const initialState: UiState = {
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
export const uiReducer = uiSlice.reducer
