import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { MAIN_SIDEBAR_DEFAULT_WIDTH } from '@components/main-sidebar/constants'
import { getMainSidebarWidthFromLocalStorage } from '@components/main-sidebar/local-storage'

export interface UiState {
    activeDimensionModal: string | null
    isDetailsPanelVisible: boolean
    isLayoutPanelExpanded: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
    mainSidebarWidth: number
}

export const initialState: UiState = {
    activeDimensionModal: null,
    isDetailsPanelVisible: false,
    isLayoutPanelExpanded: true,
    isLayoutPanelVisible: true,
    isMainSidebarVisible: true,
    mainSidebarWidth: getMainSidebarWidthFromLocalStorage(),
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        clearUi: () => initialState,
        setUiMainSidebarWidth: (state, action: PayloadAction<number>) => {
            state.mainSidebarWidth = action.payload
        },
        resetUiMainSidebarWidth: (state) => {
            state.mainSidebarWidth = MAIN_SIDEBAR_DEFAULT_WIDTH
        },
        setUiActiveDimensionModal: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.activeDimensionModal = action.payload
        },
        setUiDetailsPanelVisible: (state, action: PayloadAction<boolean>) => {
            state.isDetailsPanelVisible = action.payload
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
        getUiActiveDimensionModal: (state) => state.activeDimensionModal,
        getUiDetailsPanelVisible: (state) => state.isDetailsPanelVisible,
        getUiLayoutPanelExpanded: (state) => state.isLayoutPanelExpanded,
        getUiLayoutPanelVisible: (state) => state.isLayoutPanelVisible,
        getUiMainSidebarVisible: (state) => state.isMainSidebarVisible,
        getUiMainSidebarWidth: (state) => state.mainSidebarWidth,
        getUiShowExpandedVisualizationCanvas: (state) =>
            !state.isMainSidebarVisible && !state.isLayoutPanelVisible,
    },
})

export const {
    clearUi,
    setUiMainSidebarWidth,
    resetUiMainSidebarWidth,
    setUiActiveDimensionModal,
    setUiDetailsPanelVisible,
    toggleUiLayoutPanelExpanded,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    toggleUiShowExpandedVisualizationCanvas,
} = uiSlice.actions
export const {
    getUiActiveDimensionModal,
    getUiDetailsPanelVisible,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiMainSidebarWidth,
    getUiShowExpandedVisualizationCanvas,
} = uiSlice.selectors
