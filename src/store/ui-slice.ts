import { MAIN_SIDEBAR_DEFAULT_WIDTH } from '@components/main-sidebar/constants'
import { getMainSidebarWidthFromLocalStorage } from '@components/main-sidebar/local-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { Axis } from '@types'

interface PanelVisibility {
    isDetailsPanelVisible: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
}

export type ActiveDimensionPopover = {
    dimensionId: string
} & (
    | {
          source: 'sidebar'
      }
    | {
          source: 'layout'
          axisId: Axis
      }
)

export type ActiveDimensionPopoverState = ActiveDimensionPopover | null

export interface UiState {
    activeDimensionPopover: ActiveDimensionPopoverState
    isDetailsPanelVisible: boolean
    isLayoutPanelExpanded: boolean
    isLayoutPanelVisible: boolean
    isMainSidebarVisible: boolean
    mainSidebarWidth: number
    savedPanelVisibility: PanelVisibility | null
}

export const initialState: UiState = {
    activeDimensionPopover: null,
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
        setUiActiveDimensionPopover: (
            state,
            action: PayloadAction<ActiveDimensionPopoverState>
        ) => {
            state.activeDimensionPopover = action.payload
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
        getUiActiveDimensionPopover: (state) => state.activeDimensionPopover,
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
    setUiActiveDimensionPopover,
    toggleUiDetailsPanelVisible,
    toggleUiLayoutPanelExpanded,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    toggleUiShowExpandedVisualizationCanvas,
} = uiSlice.actions
export const {
    getUiActiveDimensionPopover,
    getUiDetailsPanelVisible,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiMainSidebarWidth,
    getUiShowExpandedVisualizationCanvas,
} = uiSlice.selectors
