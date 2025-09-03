import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { SupportedVisType } from '@constants/visualization-types'
import { getUserSidebarWidthFromLocalStorage } from '@modules/local-storage'

export interface UiState {
    visualizationType: SupportedVisType
    hideLayoutPanel: boolean
    hideMainSidebar: boolean
    accessoryPanelWidth: number
    showAccessoryPanel: boolean
    showDetailsPanel: boolean
    showExpandedLayoutPanel: boolean
    layout: {
        columns: []
        filters: []
    }
}

export const initialState: UiState = {
    visualizationType: 'LINE_LIST',
    hideLayoutPanel: false,
    hideMainSidebar: false,
    accessoryPanelWidth: getUserSidebarWidthFromLocalStorage(),
    showAccessoryPanel: true,
    showDetailsPanel: false,
    showExpandedLayoutPanel: false,
    layout: {
        columns: [
            'enrollmentDate',
            'fdc6uOvgoji',
            'ZzYYXq4fJie.X8zyunlgUfM',
            'A03MvHHogjR.X8zyunlgUfM',
        ],
        filters: ['cejWyOfXge6'],
    },
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
        setUiLayout: (state, action: PayloadAction<UiState['layout']>) => {
            state.layout = action.payload
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
        getUILayout: (state) => state.layout,
    },
})

export const {
    setUiVisualizationType,
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelOpen,
    setUiDetailsPanelOpen,
    setUiLayout,
    toggleUiLayoutPanelHidden,
    toggleUiSidebarHidden,
} = uiSlice.actions
export const {
    getUiVisualizationType,
    getUiAccessoryPanelWidth,
    getUiAccessoryPanelOpen,
    getUiDetailsPanelOpen,
    getUiLayoutPanelHidden,
    getUILayout,
    getUiSidebarHidden,
} = uiSlice.selectors
