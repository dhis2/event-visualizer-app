import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { SupportedVisType } from '@constants/visualization-types'

export interface UiState {
    visualizationType: SupportedVisType
    showAccessoryPanel: boolean
    showDetailsPanel: boolean
}

export const initialState: UiState = {
    visualizationType: 'LINE_LIST',
    showAccessoryPanel: true,
    showDetailsPanel: false,
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setUiVisualizationType: (
            state,
            action: PayloadAction<SupportedVisType>
        ) => {
            state.visualizationType = action.payload
        },
        setUiDetailsPanelOpen: (state, action: PayloadAction<boolean>) => {
            state.showDetailsPanel = action.payload
            // Always close left sidebar when opening the right sidebar
            // Leave left sidebar unaffected when closing the right sidebar
            state.showAccessoryPanel = action.payload
                ? false
                : state.showAccessoryPanel
        },
    },
    selectors: {
        getUiVisualizationType: (state) => state.visualizationType,
        getUiDetailsPanelOpen: (state) => state.showDetailsPanel,
    },
})

export const { setUiVisualizationType, setUiDetailsPanelOpen } = uiSlice.actions
export const { getUiVisualizationType, getUiDetailsPanelOpen } =
    uiSlice.selectors
