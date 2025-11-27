import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_OPTIONS } from '@constants/options'
import type {
    EventVisualizationOptions,
    OutputType,
    VisualizationType,
} from '@types'

type ConditionsObject = { condition?: string | string[]; legendSet?: string }

const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_CONDITIONS_OBJECT: ConditionsObject = {
    condition: undefined,
    legendSet: undefined,
}

export interface VisUiConfigState {
    visualizationType: VisualizationType
    outputType: OutputType
    layout: {
        columns: string[]
        filters: string[]
        rows: string[]
    }
    itemsByDimension: Record<string, string[]>
    conditionsByDimension: Record<string, ConditionsObject>
    options: EventVisualizationOptions
}

export const initialState: VisUiConfigState = {
    visualizationType: 'LINE_LIST',
    outputType: 'EVENT',
    layout: {
        columns: [],
        filters: [],
        rows: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
    /* Options will be overridden by a computed preloaded state that takes
     * the `digitGroupSeparator` user setting into account */
    options: DEFAULT_OPTIONS,
}

type SetOptionPayload = {
    key: keyof EventVisualizationOptions
    value: EventVisualizationOptions[keyof EventVisualizationOptions]
}

export const visUiConfigSlice = createSlice({
    name: 'visUiConfig',
    initialState,
    reducers: {
        clearVisUiConfig: () => initialState,
        setVisUiConfig: (
            state,
            action: PayloadAction<Partial<VisUiConfigState>>
        ) => {
            return { ...state, ...action.payload }
        },
        setVisUiConfigVisualizationType: (
            state,
            action: PayloadAction<VisualizationType>
        ) => {
            state.visualizationType = action.payload
        },
        setVisUiConfigLayout: (
            state,
            action: PayloadAction<VisUiConfigState['layout']>
        ) => {
            state.layout = action.payload
        },
        setVisUiConfigOutputType: (
            state,
            action: PayloadAction<OutputType>
        ) => {
            state.outputType = action.payload
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
        setVisUiConfigOption: (
            state,
            action: PayloadAction<SetOptionPayload>
        ) => {
            state.options = {
                ...state.options,
                [action.payload.key]: action.payload.value,
            }
        },
    },
    selectors: {
        getVisUiConfigVisualizationType: (state) => state.visualizationType,
        getVisUiConfigLayout: (state) => state.layout,
        getVisUiConfigOutputType: (state) => state.outputType,
        getVisUiConfigItemsByDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId] || EMPTY_STRING_ARRAY,
        getVisUiConfigConditionsByDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId] || EMPTY_CONDITIONS_OBJECT,
        getVisUiConfigOption: (state, key: keyof EventVisualizationOptions) =>
            state.options[key],
    },
})

export const {
    clearVisUiConfig,
    setVisUiConfig,
    setVisUiConfigVisualizationType,
    setVisUiConfigLayout,
    setVisUiConfigOutputType,
    setVisUiConfigItemsByDimension,
    setVisUiConfigConditionsByDimension,
    setVisUiConfigOption,
} = visUiConfigSlice.actions

export const {
    getVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
    getVisUiConfigOption,
} = visUiConfigSlice.selectors
