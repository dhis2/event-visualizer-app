import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { SupportedVisType } from '@constants/visualization-types'
import { getUserSidebarWidthFromLocalStorage } from '@modules/local-storage'

export interface UiState {
    accessoryPanelWidth: number
    isAccessoryPanelVisible: boolean
    isDetailsPanelVisible: boolean
    isExpandedLayoutPanelVisible: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
}

export const initialState: UiState = {
    accessoryPanelWidth: getUserSidebarWidthFromLocalStorage(),
    isAccessoryPanelVisible: true,
    isDetailsPanelVisible: false,
    isExpandedLayoutPanelVisible: false,
    isLayoutPanelVisible: true,
    isMainSidebarVisible: true,
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        clearUi: () => initialState,
        setUiAccessoryPanelWidth: (state, action: PayloadAction<number>) => {
            state.accessoryPanelWidth = action.payload
        },

        setUiAccessoryPanelVisible: (state, action: PayloadAction<boolean>) => {
            state.isAccessoryPanelVisible = action.payload
            // Always close right sidebar when opening the left sidebar
            // Leave right sidebar unaffected when closing the left sidebar
            state.isDetailsPanelVisible = action.payload
                ? false
                : state.isDetailsPanelVisible
        },
        setUiDetailsPanelVisible: (state, action: PayloadAction<boolean>) => {
            state.isDetailsPanelVisible = action.payload
            // Always close left sidebar when opening the right sidebar
            // Leave left sidebar unaffected when closing the right sidebar
            state.isAccessoryPanelVisible = action.payload
                ? false
                : state.isAccessoryPanelVisible
        },
        toggleUiMainSidebarVisible: (state) => {
            state.isMainSidebarVisible = !state.isMainSidebarVisible
        },
        toggleUiLayoutPanelVisible: (state) => {
            state.isLayoutPanelVisible = !state.isLayoutPanelVisible
        },
    },
    selectors: {
        getUiAccessoryPanelWidth: (state) => state.accessoryPanelWidth,
        getUiAccessoryPanelVisible: (state) => state.isAccessoryPanelVisible,
        getUiDetailsPanelVisible: (state) => state.isDetailsPanelVisible,
        getUiMainSidebarVisible: (state) => state.isMainSidebarVisible,
        getUiLayoutPanelVisible: (state) => state.isLayoutPanelVisible,
    },
})

export const {
    clearUi,
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelVisible,
    setUiDetailsPanelVisible,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
} = uiSlice.actions
export const {
    getUiAccessoryPanelWidth,
    getUiAccessoryPanelVisible,
    getUiDetailsPanelVisible,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
} = uiSlice.selectors
