import { MAIN_SIDEBAR_DEFAULT_WIDTH } from '@components/main-sidebar/constants'
import { getMainSidebarWidthFromLocalStorage } from '@components/main-sidebar/local-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

interface PanelVisibility {
    isDetailsPanelVisible: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
}

export type DimensionDialogMode = 'modal' | 'popover'
export type DimensionDialogOriginType = 'sidebar' | 'chip'

export interface UiState {
    activeDimensionModal: string | null
    dimensionDialogMode: DimensionDialogMode
    dimensionDialogOriginType: DimensionDialogOriginType | null
    isDetailsPanelVisible: boolean
    isLayoutPanelExpanded: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
    mainSidebarWidth: number
    savedPanelVisibility: PanelVisibility | null
}

export const initialState: UiState = {
    activeDimensionModal: null,
    dimensionDialogMode: 'modal',
    dimensionDialogOriginType: null,
    isDetailsPanelVisible: false,
    isLayoutPanelExpanded: true,
    isLayoutPanelVisible: true,
    isMainSidebarVisible: true,
    mainSidebarWidth: getMainSidebarWidthFromLocalStorage(),
    savedPanelVisibility: null,
}

const panelKeys: (keyof PanelVisibility)[] = [
    'isDetailsPanelVisible',
    'isLayoutPanelVisible',
    'isMainSidebarVisible',
]

function isFullscreen(state: UiState) {
    return panelKeys.every((key) => !state[key])
}

function savePanelVisibility(state: UiState) {
    state.savedPanelVisibility = {
        isDetailsPanelVisible: state.isDetailsPanelVisible,
        isLayoutPanelVisible: state.isLayoutPanelVisible,
        isMainSidebarVisible: state.isMainSidebarVisible,
    }
}

function hideAllPanels(state: UiState) {
    for (const key of panelKeys) {
        state[key] = false
    }
}

function restorePanelVisibility(state: UiState) {
    const saved = state.savedPanelVisibility
    for (const key of panelKeys) {
        state[key] = saved?.[key] ?? initialState[key]
    }
    state.savedPanelVisibility = null
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
            if (action.payload === null) {
                state.dimensionDialogOriginType = null
            }
        },
        setUiDimensionDialogOriginType: (
            state,
            action: PayloadAction<DimensionDialogOriginType | null>
        ) => {
            state.dimensionDialogOriginType = action.payload
        },
        setUiDimensionDialogMode: (
            state,
            action: PayloadAction<DimensionDialogMode>
        ) => {
            state.dimensionDialogMode = action.payload
        },
        toggleUiDimensionDialogMode: (state) => {
            state.dimensionDialogMode =
                state.dimensionDialogMode === 'modal' ? 'popover' : 'modal'
        },
        toggleUiDetailsPanelVisible: (state) => {
            state.isDetailsPanelVisible = !state.isDetailsPanelVisible
            state.savedPanelVisibility = null
        },
        toggleUiMainSidebarVisible: (state) => {
            state.isMainSidebarVisible = !state.isMainSidebarVisible
            state.savedPanelVisibility = null
        },
        toggleUiLayoutPanelExpanded: (state) => {
            state.isLayoutPanelExpanded = !state.isLayoutPanelExpanded
        },
        toggleUiLayoutPanelVisible: (state) => {
            state.isLayoutPanelVisible = !state.isLayoutPanelVisible
            state.savedPanelVisibility = null
        },
        toggleUiShowExpandedVisualizationCanvas: (state) => {
            if (isFullscreen(state)) {
                restorePanelVisibility(state)
            } else {
                savePanelVisibility(state)
                hideAllPanels(state)
            }
        },
    },
    selectors: {
        getUiActiveDimensionModal: (state) => state.activeDimensionModal,
        getUiDimensionDialogMode: (state) => state.dimensionDialogMode,
        getUiDimensionDialogOriginType: (state) =>
            state.dimensionDialogOriginType,
        getUiDetailsPanelVisible: (state) => state.isDetailsPanelVisible,
        getUiLayoutPanelExpanded: (state) => state.isLayoutPanelExpanded,
        getUiLayoutPanelVisible: (state) => state.isLayoutPanelVisible,
        getUiMainSidebarVisible: (state) => state.isMainSidebarVisible,
        getUiMainSidebarWidth: (state) => state.mainSidebarWidth,
        getUiShowExpandedVisualizationCanvas: (state) =>
            !state.isMainSidebarVisible &&
            !state.isLayoutPanelVisible &&
            !state.isDetailsPanelVisible,
    },
})

export const {
    clearUi,
    setUiMainSidebarWidth,
    resetUiMainSidebarWidth,
    setUiActiveDimensionModal,
    setUiDimensionDialogMode,
    setUiDimensionDialogOriginType,
    toggleUiDetailsPanelVisible,
    toggleUiDimensionDialogMode,
    toggleUiLayoutPanelExpanded,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    toggleUiShowExpandedVisualizationCanvas,
} = uiSlice.actions
export const {
    getUiActiveDimensionModal,
    getUiDimensionDialogMode,
    getUiDimensionDialogOriginType,
    getUiDetailsPanelVisible,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiMainSidebarWidth,
    getUiShowExpandedVisualizationCanvas,
} = uiSlice.selectors
