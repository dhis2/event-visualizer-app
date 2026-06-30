import { getLayoutPanelHeightFromLocalStorage } from '@components/layout-panel/local-storage'
import { SIDEBAR_DEFAULT_WIDTH } from '@components/sidebar/constants'
import { getSidebarWidthFromLocalStorage } from '@components/sidebar/local-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { OutputType } from '@types'

/* A user-set height in px, or 'AUTO_FIT' to fit the content. */
export type LayoutPanelHeight = number | 'AUTO_FIT'

interface PanelVisibility {
    isDetailsPanelVisible: boolean
    isLayoutPanelVisible: boolean
    isSidebarVisible: boolean
}

export interface UiState {
    activeDimensionModal: string | null
    isDetailsPanelVisible: boolean
    isLayoutPanelExpanded: boolean
    isLayoutPanelVisible: boolean
    isSidebarVisible: boolean
    layoutPanelHeight: LayoutPanelHeight
    sidebarWidth: number
    savedPanelVisibility: PanelVisibility | null
    updateAnimationShowingFor: OutputType | null
}

export const initialState: UiState = {
    activeDimensionModal: null,
    isDetailsPanelVisible: false,
    isLayoutPanelExpanded: true,
    isLayoutPanelVisible: true,
    isSidebarVisible: true,
    layoutPanelHeight: getLayoutPanelHeightFromLocalStorage(),
    sidebarWidth: getSidebarWidthFromLocalStorage(),
    savedPanelVisibility: null,
    updateAnimationShowingFor: null,
}

const panelKeys: (keyof PanelVisibility)[] = [
    'isDetailsPanelVisible',
    'isLayoutPanelVisible',
    'isSidebarVisible',
]

function isFullscreen(state: UiState) {
    return panelKeys.every((key) => !state[key])
}

function savePanelVisibility(state: UiState) {
    state.savedPanelVisibility = {
        isDetailsPanelVisible: state.isDetailsPanelVisible,
        isLayoutPanelVisible: state.isLayoutPanelVisible,
        isSidebarVisible: state.isSidebarVisible,
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
        setUiUpdateAnimationShowingFor: (
            state,
            action: PayloadAction<OutputType | null>
        ) => {
            state.updateAnimationShowingFor = action.payload
        },
        setUiSidebarWidth: (state, action: PayloadAction<number>) => {
            state.sidebarWidth = action.payload
        },
        resetUiSidebarWidth: (state) => {
            state.sidebarWidth = SIDEBAR_DEFAULT_WIDTH
        },
        setUiActiveDimensionModal: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.activeDimensionModal = action.payload
        },
        toggleUiDetailsPanelVisible: (state) => {
            state.isDetailsPanelVisible = !state.isDetailsPanelVisible
            state.savedPanelVisibility = null
        },
        toggleUiSidebarVisible: (state) => {
            state.isSidebarVisible = !state.isSidebarVisible
            state.savedPanelVisibility = null
        },
        toggleUiLayoutPanelExpanded: (state) => {
            state.isLayoutPanelExpanded = !state.isLayoutPanelExpanded
        },
        setUiLayoutPanelHeight: (
            state,
            action: PayloadAction<LayoutPanelHeight>
        ) => {
            state.layoutPanelHeight = action.payload
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
        getUiUpdateAnimationShowingFor: (state) =>
            state.updateAnimationShowingFor,
        getUiDetailsPanelVisible: (state) => state.isDetailsPanelVisible,
        getUiLayoutPanelExpanded: (state) => state.isLayoutPanelExpanded,
        getUiLayoutPanelHeight: (state) => state.layoutPanelHeight,
        getUiLayoutPanelVisible: (state) => state.isLayoutPanelVisible,
        getUiSidebarVisible: (state) => state.isSidebarVisible,
        getUiSidebarWidth: (state) => state.sidebarWidth,
        getUiShowExpandedVisualizationCanvas: (state) =>
            !state.isSidebarVisible &&
            !state.isLayoutPanelVisible &&
            !state.isDetailsPanelVisible,
    },
})

export const {
    clearUi,
    setUiUpdateAnimationShowingFor,
    setUiSidebarWidth,
    resetUiSidebarWidth,
    setUiActiveDimensionModal,
    toggleUiDetailsPanelVisible,
    toggleUiLayoutPanelExpanded,
    setUiLayoutPanelHeight,
    toggleUiLayoutPanelVisible,
    toggleUiSidebarVisible,
    toggleUiShowExpandedVisualizationCanvas,
} = uiSlice.actions
export const {
    getUiActiveDimensionModal,
    getUiUpdateAnimationShowingFor,
    getUiDetailsPanelVisible,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelHeight,
    getUiLayoutPanelVisible,
    getUiSidebarVisible,
    getUiSidebarWidth,
    getUiShowExpandedVisualizationCanvas,
} = uiSlice.selectors
