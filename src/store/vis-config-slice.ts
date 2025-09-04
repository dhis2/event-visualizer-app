import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { InputType } from '@constants/input-types'
import { INPUT_TYPE_ENROLLMENT } from '@constants/input-types'
import type { SupportedVisType } from '@constants/visualization-types'

export interface VisConfigState {
    visualizationType: SupportedVisType
    inputType: InputType
    layout: {
        columns: string[]
        filters: string[]
    }
    itemsByDimension: Record<string, unknown>
    conditionsByDimension: Record<string, unknown>
}

export const initialState: VisConfigState = {
    visualizationType: 'LINE_LIST',
    inputType: INPUT_TYPE_ENROLLMENT,
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

export const visConfigSlice = createSlice({
    name: 'visConfig',
    initialState,
    reducers: {
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
