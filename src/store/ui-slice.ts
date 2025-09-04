import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getUserSidebarWidthFromLocalStorage } from '@modules/local-storage'

export interface UiState {
    hideLayoutPanel: boolean
    hideMainSidebar: boolean
    accessoryPanelWidth: number
    showAccessoryPanel: boolean
    showDetailsPanel: boolean
    showExpandedLayoutPanel: boolean
}

export const initialState: UiState = {
    hideLayoutPanel: false,
    hideMainSidebar: false,
    accessoryPanelWidth: getUserSidebarWidthFromLocalStorage(),
    showAccessoryPanel: true,
    showDetailsPanel: false,
    showExpandedLayoutPanel: false,
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
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
        getUiAccessoryPanelWidth: (state) => state.accessoryPanelWidth,
        getUiAccessoryPanelOpen: (state) => state.showAccessoryPanel,
        getUiDetailsPanelOpen: (state) => state.showDetailsPanel,
        getUiSidebarHidden: (state) => state.hideMainSidebar,
        getUiLayoutPanelHidden: (state) => state.hideLayoutPanel,
    },
})

export const {
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelOpen,
    setUiDetailsPanelOpen,
    toggleUiLayoutPanelHidden,
    toggleUiSidebarHidden,
} = uiSlice.actions
export const {
    getUiAccessoryPanelWidth,
    getUiAccessoryPanelOpen,
    getUiDetailsPanelOpen,
    getUiLayoutPanelHidden,
    getUiSidebarHidden,
} = uiSlice.selectors
