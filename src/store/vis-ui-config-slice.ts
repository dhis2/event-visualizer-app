import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { SupportedInputType } from '@constants/input-types'
import type { SupportedVisType } from '@constants/visualization-types'

const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_CONDITIONS_OBJECT = { condition: undefined, legendSet: undefined }

export interface VisUiConfigState {
    visualizationType: SupportedVisType
    inputType: SupportedInputType
    layout: {
        columns: string[]
        filters: string[]
        rows: string[]
    }
    itemsByDimension: Record<string, string[]>
    conditionsByDimension: Record<
        string,
        { condition?: string; legendSet?: string }
    >
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
            action: PayloadAction<Record<string, string[]>>
        ) => {
            state.itemsByDimension = action.payload
        },
        setVisUiConfigConditionsByDimension: (
            state,
            action: PayloadAction<
                Record<string, { condition?: string; legendSet?: string }>
            >
        ) => {
            state.conditionsByDimension = action.payload
        },
    },
    selectors: {
        getVisUiConfigVisualizationType: (state) => state.visualizationType,
        getVisUiConfigLayout: (state) => state.layout,
        getVisUiConfigInputType: (state) => state.inputType,
        getVisUiConfigItemsByDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId] || EMPTY_STRING_ARRAY,
        getVisUiConfigConditionsByDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId] || EMPTY_CONDITIONS_OBJECT,
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
