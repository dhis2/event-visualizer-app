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

export type ConditionsObject = {
    condition?: string | string[]
    legendSet?: string
}

export type RepetitionsObject = {
    mostRecent: number
    oldest: number
}

const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_CONDITIONS_OBJECT: ConditionsObject = {
    condition: undefined,
    legendSet: undefined,
}
export const DEFAULT_REPETITIONS_OBJECT: RepetitionsObject = {
    mostRecent: 1,
    oldest: 0,
}

export interface VisUiConfigState {
    visualizationType: VisualizationType
    outputType: OutputType
    layout: Layout
    itemsByDimension: Record<string, string[]>
    conditionsByDimension: Record<string, ConditionsObject | undefined>
    repetitionsByDimension: Record<string, RepetitionsObject | undefined>
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
    repetitionsByDimension: {},
}

type SetConditionsByDimensionPayload = {
    dimensionId: string
    conditions?: string
    legendSet?: string
}

type SetItemsByDimensionPayload = {
    dimensionId: string // dimensionId, including uids
    itemIds: string[] // list of item ids
}

type SetOptionPayload = {
    key: keyof EventVisualizationOptions
    value: EventVisualizationOptions[keyof EventVisualizationOptions]
}

type SetRepetitionsByDimensionPayload = {
    dimensionId: string
    repetitions?: RepetitionsObject
}

const resolveSortInsertIndex = ({
    insertIndex,
    insertAfter,
    targetLength,
}: {
    insertIndex?: number
    insertAfter?: boolean
    targetLength: number
}) => {
    const baseIndex = insertIndex ?? targetLength
    const adjustedIndex = insertAfter ? baseIndex + 1 : baseIndex
    return Math.max(0, Math.min(adjustedIndex, targetLength))
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
            action: PayloadAction<SetConditionsByDimensionPayload>
        ) => {
            const { dimensionId, conditions, legendSet } = action.payload

            state.conditionsByDimension = {
                ...state.conditionsByDimension,
                [dimensionId]:
                    conditions?.length || legendSet
                        ? { condition: conditions, legendSet }
                        : undefined,
            }
        },
        setVisUiConfigRepetitionsByDimension: (
            state,
            action: PayloadAction<SetRepetitionsByDimensionPayload>
        ) => {
            const { dimensionId, repetitions } = action.payload

            state.repetitionsByDimension = {
                ...state.repetitionsByDimension,
                [dimensionId]: repetitions ?? undefined,
            }
        },
        addVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<{
                axis: Axis
                dimensionId: string
                insertIndex?: number
                insertAfter?: boolean
            }>
        ) => {
            const {
                axis,
                dimensionId,
                insertIndex,
                insertAfter = false,
            } = action.payload
            const targetArray = state.layout[axis]
            targetArray.splice(
                resolveSortInsertIndex({
                    insertIndex,
                    insertAfter,
                    targetLength: targetArray.length,
                }),
                0,
                dimensionId
            )
        },
        moveVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<{
                dimensionId: string
                sourceAxis: Axis
                targetAxis: Axis
                sourceIndex?: number
                targetIndex?: number
                insertAfter?: boolean
            }>
        ) => {
            const {
                dimensionId,
                sourceAxis,
                targetAxis,
                targetIndex,
                insertAfter = false,
            } = action.payload
            const sourceArray = state.layout[sourceAxis]
            const targetArray = state.layout[targetAxis]
            const sourceIndex =
                action.payload.sourceIndex ?? sourceArray.indexOf(dimensionId)

            if (sourceIndex === -1) {
                throw new Error(
                    `Dimension ${dimensionId} not found in source axis ${sourceAxis}`
                )
            }

            const insertionIndex = resolveSortInsertIndex({
                insertIndex: targetIndex,
                insertAfter,
                targetLength: targetArray.length,
            })
            const removalIndex =
                sourceAxis === targetAxis && insertionIndex <= sourceIndex
                    ? sourceIndex + 1
                    : sourceIndex

            targetArray.splice(insertionIndex, 0, dimensionId)
            sourceArray.splice(removalIndex, 1)
        },
        removeVisUiConfigLayoutDimension: (
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
        getVisUiConfigRepetitionsByDimension: (state, dimensionId: string) =>
            state.repetitionsByDimension[dimensionId] ||
            DEFAULT_REPETITIONS_OBJECT,
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
    setVisUiConfigRepetitionsByDimension,
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} = visUiConfigSlice.actions

export const {
    getVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigOption,
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
    getVisUiConfigRepetitionsByDimension,
} = visUiConfigSlice.selectors
