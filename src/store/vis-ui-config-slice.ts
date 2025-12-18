import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_OPTIONS } from '@constants/options'
import type {
    Axis,
    EventVisualizationOptions,
    Layout,
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
    layout: Layout
    itemsByDimension: Record<string, string[]>
    conditionsByDimension: Record<string, ConditionsObject>
    options: EventVisualizationOptions
}

export const initialState: VisUiConfigState = {
    visualizationType: 'LINE_LIST',
    /* Options will be overridden by a computed preloaded state that takes
     * the `digitGroupSeparator` user setting into account */
    options: DEFAULT_OPTIONS,
    outputType: 'EVENT',
    layout: {
        columns: [],
        filters: [],
        rows: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
}

type SetItemsByDimensionPayload = {
    dimensionId: string // dimensionId, including uids
    itemIds: string[] // list of item ids
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
        setVisUiConfigOption: (
            state,
            action: PayloadAction<SetOptionPayload>
        ) => {
            state.options = {
                ...state.options,
                [action.payload.key]: action.payload.value,
            }
        },
        setVisUiConfigOutputType: (
            state,
            action: PayloadAction<OutputType>
        ) => {
            state.outputType = action.payload
        },
        setVisUiConfigItemsByDimension: (
            state,
            action: PayloadAction<SetItemsByDimensionPayload>
        ) => {
            state.itemsByDimension = {
                ...state.itemsByDimension,
                [action.payload.dimensionId]: action.payload.itemIds,
            }
        },
        setVisUiConfigConditionsByDimension: (
            state,
            action: PayloadAction<
                Record<string, { condition?: string; legendSet?: string }>
            >
        ) => {
            state.conditionsByDimension = action.payload
        },
        addVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<{
                axis: Axis
                dimensionId: string
                insertIndex?: number
            }>
        ) => {
            const { axis, dimensionId, insertIndex } = action.payload
            const targetArray = state.layout[axis]
            const index = insertIndex ?? targetArray.length
            targetArray.splice(index, 0, dimensionId)
        },
        moveVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<{
                dimensionId: string
                sourceAxis: Axis
                targetAxis: Axis
                insertIndex?: number
            }>
        ) => {
            const { dimensionId, sourceAxis, targetAxis, insertIndex } =
                action.payload
            const sourceArray = state.layout[sourceAxis]
            const targetArray = state.layout[targetAxis]
            const sourceIndex = sourceArray.indexOf(dimensionId)
            if (sourceIndex === -1) {
                throw new Error(
                    `Dimension ${dimensionId} not found in source axis ${sourceAxis}`
                )
            }
            sourceArray.splice(sourceIndex, 1)
            const index = insertIndex ?? targetArray.length
            targetArray.splice(index, 0, dimensionId)
        },
        deleteVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<{ axis: Axis; dimensionId: string }>
        ) => {
            const { axis, dimensionId } = action.payload
            const array = state.layout[axis]
            const index = array.indexOf(dimensionId)
            if (index === -1) {
                throw new Error(
                    `Dimension ${dimensionId} not found in axis ${axis}`
                )
            }
            array.splice(index, 1)
        },
    },
    selectors: {
        getVisUiConfigVisualizationType: (state) => state.visualizationType,
        getVisUiConfigLayout: (state) => state.layout,
        getVisUiConfigOption: (state, key: keyof EventVisualizationOptions) =>
            state.options[key],
        getVisUiConfigOutputType: (state) => state.outputType,
        getVisUiConfigItemsByDimension: (state, dimensionId: string) =>
            state.itemsByDimension[dimensionId] || EMPTY_STRING_ARRAY,
        getVisUiConfigConditionsByDimension: (state, dimensionId: string) =>
            state.conditionsByDimension[dimensionId] || EMPTY_CONDITIONS_OBJECT,
    },
})

export const {
    clearVisUiConfig,
    setVisUiConfig,
    setVisUiConfigVisualizationType,
    setVisUiConfigLayout,
    setVisUiConfigOption,
    setVisUiConfigOutputType,
    setVisUiConfigItemsByDimension,
    setVisUiConfigConditionsByDimension,
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    deleteVisUiConfigLayoutDimension,
} = visUiConfigSlice.actions

export const {
    getVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigOption,
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
} = visUiConfigSlice.selectors
