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
    inputType: 'INPUT_TYPE_EVENT'
    layout: {
        columns: []
        filters: []
    }
    itemsByDimension: Record<string, unknown>
    conditionsByDimension: Record<string, unknown>
}

export const initialState: UiState = {
    visualizationType: 'LINE_LIST',
    hideLayoutPanel: false,
    hideMainSidebar: false,
    accessoryPanelWidth: getUserSidebarWidthFromLocalStorage(),
    showAccessoryPanel: true,
    showDetailsPanel: false,
    showExpandedLayoutPanel: false,
    inputType: 'INPUT_TYPE_ENROLLMENT',
    layout: {
        columns: [
            'enrollmentDate',
            'ou',
            'ZzYYXq4fJie.X8zyunlgUfM',
            'A03MvHHogjR.X8zyunlgUfM',
            'GxdhnY5wmHq',
        ],
        filters: ['cejWyOfXge6'],
    },
    itemsByDimension: {
        ou: ['fdc6uOvgoji'],
        enrollmentDate: ['LAST_6_MONTHS'],
    },
    conditionsByDimension: {
        GxdhnY5wmHq: 'GT:2500:LT:3000:NE:NV',
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
        setUiInputType: (state, action: PayloadAction<string>) => {
            state.inputType = action.payload
        },
        setUiItemsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.itemsByDimension = action.payload
        },
        setUiConditionsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.conditionsByDimension = action.payload
        },
        updateUiItemsByDimension: (
            state,
            action: PayloadAction<{ dimensionId: string; items: unknown }>
        ) => {
            state.itemsByDimension[action.payload.dimensionId] =
                action.payload.items
        },
        updateUiConditionsByDimension: (
            state,
            action: PayloadAction<{ dimensionId: string; conditions: unknown }>
        ) => {
            state.conditionsByDimension[action.payload.dimensionId] =
                action.payload.conditions
        },
        clearUiItemsByDimension: (state) => {
            state.itemsByDimension = {}
        },
        clearUiConditionsByDimension: (state) => {
            state.conditionsByDimension = {}
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
        getUiInputType: (state) => state.inputType,
        getUiItemsForDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId],
        getUiConditionsForDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId],
    },
})

export const {
    setUiVisualizationType,
    setUiAccessoryPanelWidth,
    setUiAccessoryPanelOpen,
    setUiDetailsPanelOpen,
    setUiLayout,
    setUiInputType,
    setUiItemsByDimension,
    setUiConditionsByDimension,
    updateUiItemsByDimension,
    updateUiConditionsByDimension,
    clearUiItemsByDimension,
    clearUiConditionsByDimension,
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
    getUiInputType,
    getUiItemsForDimension,
    getUiConditionsForDimension,
    getUiSidebarHidden,
} = uiSlice.selectors
