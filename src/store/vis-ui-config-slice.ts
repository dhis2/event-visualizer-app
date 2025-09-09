import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { SupportedInputType } from '@constants/input-types'
import type { SupportedVisType } from '@constants/visualization-types'

export interface VisUiConfigState {
    visualizationType: SupportedVisType
    inputType: SupportedInputType
    layout: {
        columns: string[]
        filters: string[]
        rows: string[]
    }
    itemsByDimension: Record<string, unknown>
    conditionsByDimension: Record<string, unknown>
}

export const initialState: VisUiConfigState = {
    visualizationType: 'LINE_LIST',
    inputType: 'EVENT',
    layout: {
        columns: [],
        filters: [],
        rows: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
}

export const visUiConfigSlice = createSlice({
    name: 'visUiConfig',
    initialState,
    reducers: {
        setVisUiConfig: (
            state,
            action: PayloadAction<Partial<VisUiConfigState>>
        ) => {
            return { ...state, ...action.payload }
        },
        setVisUiConfigVisualizationType: (
            state,
            action: PayloadAction<SupportedVisType>
        ) => {
            state.visualizationType = action.payload
        },
        setVisUiConfigLayout: (
            state,
            action: PayloadAction<VisUiConfigState['layout']>
        ) => {
            state.layout = action.payload
        },
        setVisUiConfigInputType: (
            state,
            action: PayloadAction<SupportedInputType>
        ) => {
            state.inputType = action.payload
        },
        setVisUiConfigItemsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.itemsByDimension = action.payload
        },
        setVisUiConfigConditionsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.conditionsByDimension = action.payload
        },
    },
    selectors: {
        getVisUiConfigVisualizationType: (state) => state.visualizationType,
        getVisUiConfigLayout: (state) => state.layout,
        getVisUiConfigInputType: (state) => state.inputType,
        getVisUiConfigItemsByDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId],
        getVisUiConfigConditionsByDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId],
    },
})

export const {
    setVisUiConfig,
    setVisUiConfigVisualizationType,
    setVisUiConfigLayout,
    setVisUiConfigInputType,
    setVisUiConfigItemsByDimension,
    setVisUiConfigConditionsByDimension,
} = visUiConfigSlice.actions

export const {
    getVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigInputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
} = visUiConfigSlice.selectors
