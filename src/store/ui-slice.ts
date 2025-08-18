import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { SupportedVisType } from '@constants/visualization-types'

export interface UiState {
    visualizationType: SupportedVisType
    hideLayoutPanel: boolean
    hideMainSidebar: boolean
    accessoryPanelWidth: number
    showAccessoryPanel: boolean
    showDetailsPanel: boolean
    showExpandedLayoutPanel: boolean
}

export const initialState: UiState = {
    visualizationType: 'LINE_LIST',

    hideLayoutPanel: false,
    hideMainSidebar: false,
    accessoryPanelWidth: 100, // TODO should come from user preferences
    showAccessoryPanel: true,
    showDetailsPanel: false,
    showExpandedLayoutPanel: false,
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // TODO use a Partial here for setUiFromVisualization
        //        setUiState: (state, action: PayloadAction<UiState>) => {
        //            state = action.payload
        //        },
        setUiVisualizationType: (
            state,
            action: PayloadAction<SupportedVisType>
        ) => {
            state.visualizationType = action.payload
        },
        setUiAccessoryPanelWidth: (state, action: PayloadAction<number>) => {
            state.accessoryPanelWidth = action.payload
        },

        setUiAccessoryPanelOpen: (state, action: PayloadAction<boolean>) => {
            state.showAccessoryPanel = action.payload
            // Always close right sidebar when opening the left sidebar
            // Leave right sidebar unaffected when closing the left sidebar
            state.showDetailsPanel = action.payload
                ? false
                : state.showDetailsPanel
        },
        setUiDetailsPanelOpen: (state, action: PayloadAction<boolean>) => {
            state.showDetailsPanel = action.payload
            // Always close left sidebar when opening the right sidebar
            // Leave left sidebar unaffected when closing the right sidebar
            state.showAccessoryPanel = action.payload
                ? false
                : state.showAccessoryPanel
        },
        toggleUiSidebarHidden: (state) => {
            state.hideMainSidebar = !state.hideMainSidebar
        },
        toggleUiLayoutPanelHidden: (state) => {
            state.hideLayoutPanel = !state.hideLayoutPanel
        },
    },
    selectors: {
        getUiVisualizationType: (state) => state.visualizationType,
        getUiAccessoryPanelWidth: (state) => state.accessoryPanelWidth,
        getUiAccessoryPanelOpen: (state) => state.showAccessoryPanel,
        getUiDetailsPanelOpen: (state) => state.showDetailsPanel,
        getUiSidebarHidden: (state) => state.hideMainSidebar,
        getUiLayoutPanelHidden: (state) => state.hideLayoutPanel,
    },
})

export const {
    setUiVisualizationType,
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelOpen,
    setUiDetailsPanelOpen,
    toggleUiLayoutPanelHidden,
    toggleUiSidebarHidden,
} = uiSlice.actions
export const uiReducer = uiSlice.reducer
