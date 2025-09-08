import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { InputType } from '@constants/input-types'
import { INPUT_TYPE_EVENT } from '@constants/input-types'
import {
    VIS_TYPE_LINE_LIST,
    type SupportedVisType,
} from '@constants/visualization-types'

export interface VisConfigState {
    visualizationType: SupportedVisType
    inputType: InputType
    layout: {
        columns: string[]
        filters: string[]
        rows: string[]
    }
    itemsByDimension: Record<string, unknown>
    conditionsByDimension: Record<string, unknown>
}

export const initialState: VisConfigState = {
    visualizationType: VIS_TYPE_LINE_LIST,
    inputType: INPUT_TYPE_EVENT,
    layout: {
        columns: [],
        filters: [],
        rows: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
}

export const visConfigSlice = createSlice({
    name: 'visConfig',
    initialState,
    reducers: {
        setVisConfig: (
            state,
            action: PayloadAction<Partial<VisConfigState>>
        ) => {
            return { ...state, ...action.payload }
        },
        setVisConfigVisualizationType: (
            state,
            action: PayloadAction<SupportedVisType>
        ) => {
            state.visualizationType = action.payload
        },
        setVisConfigLayout: (
            state,
            action: PayloadAction<VisConfigState['layout']>
        ) => {
            state.layout = action.payload
        },
        setVisConfigInputType: (state, action: PayloadAction<InputType>) => {
            state.inputType = action.payload
        },
        setVisConfigItemsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.itemsByDimension = action.payload
        },
        setVisConfigConditionsByDimension: (
            state,
            action: PayloadAction<Record<string, unknown>>
        ) => {
            state.conditionsByDimension = action.payload
        },
    },
    selectors: {
        getVisConfigVisualizationType: (state) => state.visualizationType,
        getVisConfigLayout: (state) => state.layout,
        getVisConfigInputType: (state) => state.inputType,
        getVisConfigItemsByDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId],
        getVisConfigConditionsByDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId],
    },
})

export const {
    setVisConfig,
    setVisConfigVisualizationType,
    setVisConfigLayout,
    setVisConfigInputType,
    setVisConfigItemsByDimension,
    setVisConfigConditionsByDimension,
} = visConfigSlice.actions

export const {
    getVisConfigVisualizationType,
    getVisConfigLayout,
    getVisConfigInputType,
    getVisConfigItemsByDimension,
    getVisConfigConditionsByDimension,
} = visConfigSlice.selectors
