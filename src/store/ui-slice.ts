import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { getUserSidebarWidthFromLocalStorage } from '@modules/local-storage'

export interface UiState {
    accessoryPanelWidth: number
    activeDimensionModal: string | null
    isAccessoryPanelVisible: boolean
    isDetailsPanelVisible: boolean
    isLayoutPanelExpanded: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
}

export const initialState: UiState = {
    accessoryPanelWidth: getUserSidebarWidthFromLocalStorage(),
    activeDimensionModal: null,
    isAccessoryPanelVisible: true,
    isDetailsPanelVisible: false,
    isLayoutPanelExpanded: true,
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
        setUiActiveDimensionModal: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.activeDimensionModal = action.payload
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
        toggleUiLayoutPanelExpanded: (state) => {
            state.isLayoutPanelExpanded = !state.isLayoutPanelExpanded
        },
        toggleUiLayoutPanelVisible: (state) => {
            state.isLayoutPanelVisible = !state.isLayoutPanelVisible
        },
        toggleUiShowExpandedVisualizationCanvas: (state) => {
            const nextValue = !(
                state.isMainSidebarVisible && state.isLayoutPanelVisible
            )

            state.isMainSidebarVisible = nextValue
            state.isLayoutPanelVisible = nextValue
        },
    },
    selectors: {
        getUiAccessoryPanelWidth: (state) => state.accessoryPanelWidth,
        getUiAccessoryPanelVisible: (state) => state.isAccessoryPanelVisible,
        getUiActiveDimensionModal: (state) => state.activeDimensionModal,
        getUiDetailsPanelVisible: (state) => state.isDetailsPanelVisible,
        getUiLayoutPanelExpanded: (state) => state.isLayoutPanelExpanded,
        getUiLayoutPanelVisible: (state) => state.isLayoutPanelVisible,
        getUiMainSidebarVisible: (state) => state.isMainSidebarVisible,
        getUiShowExpandedVisualizationCanvas: (state) =>
            !state.isMainSidebarVisible && !state.isLayoutPanelVisible,
    },
})

export const {
    clearUi,
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelVisible,
    setUiActiveDimensionModal,
    setUiDetailsPanelVisible,
    toggleUiLayoutPanelExpanded,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    toggleUiShowExpandedVisualizationCanvas,
} = uiSlice.actions
export const {
    getUiAccessoryPanelWidth,
    getUiAccessoryPanelVisible,
    getUiActiveDimensionModal,
    getUiDetailsPanelVisible,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiShowExpandedVisualizationCanvas,
} = uiSlice.selectors
