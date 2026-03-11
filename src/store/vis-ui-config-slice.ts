import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_OPTIONS } from '@constants/options'
import { dimensionMatches, findDimensionInLayout } from '@modules/layout'
import type {
    Axis,
    ConditionsObject,
    DimensionIdentifier,
    EventVisualizationOptions,
    Layout,
    LayoutDimension,
    LayoutDimensionUpdate,
    OutputType,
    RepetitionsObject,
    VisualizationType,
} from '@types'

const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_CONDITIONS_OBJECT: ConditionsObject = {
    condition: undefined,
    legendSet: undefined,
}
export const DEFAULT_REPETITIONS_OBJECT: RepetitionsObject = {
    mostRecent: 1,
    oldest: 0,
}

// Re-export types for consumers of this slice
export type { ConditionsObject, RepetitionsObject }

export interface VisUiConfigState {
    visualizationType: VisualizationType
    outputType: OutputType
    layout: Layout
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
        rows: [],
        filters: [],
    },
}

type SetOptionPayload = {
    key: keyof EventVisualizationOptions
    value: EventVisualizationOptions[keyof EventVisualizationOptions]
}

type AddLayoutDimensionPayload = LayoutDimension & {
    axis: Axis
    insertIndex?: number
    insertAfter?: boolean
}

type UpdateLayoutDimensionPayload = {
    identifier: DimensionIdentifier
    updates: LayoutDimensionUpdate
}

type MoveLayoutDimensionPayload = {
    identifier: DimensionIdentifier
    sourceAxis: Axis
    targetAxis: Axis
    sourceIndex?: number
    targetIndex?: number
    insertAfter?: boolean
}

type RemoveLayoutDimensionPayload = {
    identifier: DimensionIdentifier
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
        setVisUiConfigLayout: (
            state,
            action: PayloadAction<VisUiConfigState['layout']>
        ) => {
            state.layout = action.payload
        },
        addVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<AddLayoutDimensionPayload>
        ) => {
            const {
                axis,
                insertIndex,
                insertAfter = false,
                ...dimensionData
            } = action.payload

            const newDimension: LayoutDimension = dimensionData
            const axisArray = state.layout[axis]
            const index = resolveSortInsertIndex({
                insertIndex,
                insertAfter,
                targetLength: axisArray.length,
            })

            axisArray.splice(index, 0, newDimension)
        },
        updateVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<UpdateLayoutDimensionPayload>
        ) => {
            const { identifier, updates } = action.payload
            const dimension = findDimensionInLayout(state.layout, identifier)

            if (dimension) {
                Object.assign(dimension, updates)
            } else {
                throw new Error(
                    `Dimension not found: ${JSON.stringify(identifier)}`
                )
            }
        },
        moveVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<MoveLayoutDimensionPayload>
        ) => {
            const {
                identifier,
                sourceAxis,
                targetAxis,
                targetIndex,
                insertAfter = false,
            } = action.payload
            const dimension = findDimensionInLayout(state.layout, identifier)

            if (!dimension) {
                throw new Error('Could not find dimension in layout')
            }

            const sourceArray = state.layout[sourceAxis]
            const targetArray = state.layout[targetAxis]
            const sourceIndex =
                action.payload.sourceIndex ?? sourceArray.indexOf(dimension)

            if (sourceIndex === -1) {
                throw new Error(
                    `Dimension ${dimension.id} not found in source axis ${sourceAxis}`
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

            targetArray.splice(insertionIndex, 0, dimension)
            sourceArray.splice(removalIndex, 1)
        },
        removeVisUiConfigLayoutDimension: (
            state,
            action: PayloadAction<RemoveLayoutDimensionPayload>
        ) => {
            const { identifier } = action.payload

            // Search across all axes
            for (const axis of ['columns', 'rows', 'filters'] as Axis[]) {
                const axisArray = state.layout[axis]
                const index = axisArray.findIndex((layoutDimension) =>
                    dimensionMatches(layoutDimension, identifier)
                )
                if (index !== -1) {
                    axisArray.splice(index, 1)
                    return
                }
            }

            throw new Error(
                `Dimension not found: ${JSON.stringify(identifier)}`
            )
        },
        setVisUiConfigLayoutDimensionItems: (
            state,
            action: PayloadAction<{
                identifier: DimensionIdentifier
                items: string[]
            }>
        ) => {
            const { identifier, items } = action.payload
            const dimension = findDimensionInLayout(state.layout, identifier)

            if (!dimension) {
                throw new Error(
                    `Dimension not found: ${JSON.stringify(identifier)}`
                )
            }

            dimension.items = items
        },
        setVisUiConfigLayoutDimensionConditions: (
            state,
            action: PayloadAction<{
                identifier: DimensionIdentifier
                conditions: ConditionsObject
            }>
        ) => {
            const { identifier, conditions } = action.payload
            const dimension = findDimensionInLayout(state.layout, identifier)

            if (!dimension) {
                throw new Error(
                    `Dimension not found: ${JSON.stringify(identifier)}`
                )
            }

            dimension.conditions = conditions
        },
        setVisUiConfigLayoutDimensionRepetitions: (
            state,
            action: PayloadAction<{
                identifier: DimensionIdentifier
                repetitions: RepetitionsObject
            }>
        ) => {
            const { identifier, repetitions } = action.payload
            const dimension = findDimensionInLayout(state.layout, identifier)

            if (!dimension) {
                throw new Error(
                    `Dimension not found: ${JSON.stringify(identifier)}`
                )
            }

            dimension.repetitions = repetitions
        },
    },
    selectors: {
        getVisUiConfigVisualizationType: (state) => state.visualizationType,
        getVisUiConfigLayout: (state) => state.layout,
        getVisUiConfigOutputType: (state) => state.outputType,
        getVisUiConfigOption: (state, key: keyof EventVisualizationOptions) =>
            state.options[key],
        getVisUiConfigLayoutDimensionsForAxis: (state, axis: Axis) =>
            state.layout[axis],
        getVisUiConfigAllLayoutDimensions: (state): LayoutDimension[] => [
            ...state.layout.columns,
            ...state.layout.rows,
            ...state.layout.filters,
        ],
        getVisUiConfigLayoutDimension: (
            state,
            identifier: DimensionIdentifier
        ): LayoutDimension | undefined =>
            findDimensionInLayout(state.layout, identifier),
        getVisUiConfigLayoutDimensionItems: (
            state,
            identifier: DimensionIdentifier
        ): string[] =>
            findDimensionInLayout(state.layout, identifier)?.items ??
            EMPTY_STRING_ARRAY,
        getVisUiConfigLayoutDimensionConditions: (
            state,
            identifier: DimensionIdentifier
        ): ConditionsObject =>
            findDimensionInLayout(state.layout, identifier)?.conditions ??
            EMPTY_CONDITIONS_OBJECT,
        getVisUiConfigLayoutDimensionRepetitions: (
            state,
            identifier: DimensionIdentifier
        ): RepetitionsObject =>
            findDimensionInLayout(state.layout, identifier)?.repetitions ??
            DEFAULT_REPETITIONS_OBJECT,
    },
})

export const {
    clearVisUiConfig,
    setVisUiConfig,
    setVisUiConfigVisualizationType,
    setVisUiConfigOption,
    setVisUiConfigOutputType,
    setVisUiConfigLayout,
    addVisUiConfigLayoutDimension,
    updateVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
    setVisUiConfigLayoutDimensionItems,
    setVisUiConfigLayoutDimensionConditions,
    setVisUiConfigLayoutDimensionRepetitions,
} = visUiConfigSlice.actions

export const {
    getVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigOutputType,
    getVisUiConfigOption,
    getVisUiConfigLayoutDimensionsForAxis,
    getVisUiConfigAllLayoutDimensions,
    getVisUiConfigLayoutDimension,
    getVisUiConfigLayoutDimensionItems,
    getVisUiConfigLayoutDimensionConditions,
    getVisUiConfigLayoutDimensionRepetitions,
} = visUiConfigSlice.selectors
