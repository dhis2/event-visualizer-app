import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { EngineError } from '@api/parse-engine-error'
import type { DataSourceFilter } from '@types'

type DimensionGroupState = {
    isCollapsed: boolean
    isLoading: boolean
    error?: EngineError
}
type DimensionGroupStates = Record<string, DimensionGroupState>
type AllGroupLoadErrors = Array<{ groupKey: string; error: EngineError }>

export interface DimensionSelectionState {
    dataSourceId: string | null
    searchTerm: string
    filter: DataSourceFilter | null
    // TODO: update to a string literal once all dimension-group identifiers are known
    dimensionGroupStates: DimensionGroupStates
    multiSelectedDimensionIds: Array<string>
}

export const initialState: DimensionSelectionState = {
    dataSourceId: null,
    searchTerm: '',
    filter: null,
    dimensionGroupStates: {},
    multiSelectedDimensionIds: [],
}

export const initialDimensionGroupState: DimensionGroupState = {
    isCollapsed: false,
    isLoading: false,
    error: undefined,
}

const throwErrorIfGroupIsUndefined = (
    dimensionGroupStates: DimensionGroupStates,
    key: string
) => {
    if (!dimensionGroupStates[key]) {
        throw new Error(
            `Dimension group ${key} does not exist. Ensure to create it before updating.`
        )
    }
}

export const dimensionSelectionSlice = createSlice({
    name: 'dimensionSelection',
    initialState,
    reducers: {
        clearDataSourceId: (state) => {
            state.dataSourceId = null
        },
        setDataSourceId: (state, action: PayloadAction<string>) => {
            state.dataSourceId = action.payload
        },
        clearSearchTerm: (state) => {
            state.searchTerm = initialState.searchTerm
        },
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload
        },
        clearFilter: (state) => {
            state.filter = initialState.filter
        },
        setFilter: (state, action: PayloadAction<DataSourceFilter>) => {
            state.filter = action.payload
        },
        clearDimensionGroupStates: (state) => {
            state.dimensionGroupStates = initialState.dimensionGroupStates
        },
        removeDimensionGroupState: (state, action: PayloadAction<string>) => {
            delete state.dimensionGroupStates[action.payload]
        },
        addDimensionGroupState: (state, action: PayloadAction<string>) => {
            state.dimensionGroupStates[action.payload] =
                initialDimensionGroupState
        },
        toggleAllDimensionGroupsIsCollapsed: (state) => {
            const dimensionGroupStatesArray = Object.values(
                state.dimensionGroupStates
            )
            // When there are no groups, they cannot be collapsed
            if (dimensionGroupStatesArray.length === 0) {
                return
            }
            const areAllCollapsed = dimensionGroupStatesArray.every(
                ({ isCollapsed }) => isCollapsed
            )
            dimensionGroupStatesArray.forEach((dimensionGroupState) => {
                dimensionGroupState.isCollapsed = !areAllCollapsed
            })
        },
        toggleDimensionGroupIsCollapsed: (
            state,
            action: PayloadAction<string>
        ) => {
            throwErrorIfGroupIsUndefined(
                state.dimensionGroupStates,
                action.payload
            )

            state.dimensionGroupStates[action.payload].isCollapsed =
                !state.dimensionGroupStates[action.payload].isCollapsed
        },
        setDimensionGroupLoadStart: (state, action: PayloadAction<string>) => {
            throwErrorIfGroupIsUndefined(
                state.dimensionGroupStates,
                action.payload
            )

            state.dimensionGroupStates[action.payload].isLoading = true
            state.dimensionGroupStates[action.payload].error = undefined
        },
        setDimensionGroupLoadError: (
            state,
            action: PayloadAction<{ id: string; error: EngineError }>
        ) => {
            throwErrorIfGroupIsUndefined(
                state.dimensionGroupStates,
                action.payload.id
            )
            state.dimensionGroupStates[action.payload.id].isLoading = false
            state.dimensionGroupStates[action.payload.id].error =
                action.payload.error
        },
        setDimensionGroupLoadSuccess: (
            state,
            action: PayloadAction<string>
        ) => {
            throwErrorIfGroupIsUndefined(
                state.dimensionGroupStates,
                action.payload
            )
            state.dimensionGroupStates[action.payload].isLoading = false
        },
        clearMultiSelection: (state) => {
            state.multiSelectedDimensionIds = []
        },
        addItemToMultiSelection: (state, action: PayloadAction<string>) => {
            if (!state.multiSelectedDimensionIds.includes(action.payload)) {
                state.multiSelectedDimensionIds.push(action.payload)
            }
        },
        removeItemFromMultiSelection: (
            state,
            action: PayloadAction<string>
        ) => {
            state.multiSelectedDimensionIds =
                state.multiSelectedDimensionIds.filter(
                    (id) => id !== action.payload
                )
        },
    },
    selectors: {
        getDataSourceId: (state) => state.dataSourceId,
        isSelectedDataSourceId: (state, id: string) =>
            state.dataSourceId === id,
        getSearchTerm: (state) => state.searchTerm,
        getFilter: (state) => state.filter,
        areAllDimensionGroupsCollapsed: createSelector(
            (state: DimensionSelectionState) => state.dimensionGroupStates,
            (dimensionGroupStates) => {
                const values = Object.values(dimensionGroupStates)
                // When there are no groups, they cannot be collapsed
                if (values.length === 0) {
                    return false
                }
                return values.every(({ isCollapsed }) => isCollapsed)
            }
        ),
        isAnyDimensionGroupLoading: createSelector(
            (state: DimensionSelectionState) => state.dimensionGroupStates,
            (dimensionGroupStates) =>
                Object.values(dimensionGroupStates).some(
                    (dimensionGroupState) => dimensionGroupState.isLoading
                )
        ),
        getAllDimensionGroupLoadErrors: createSelector(
            (state: DimensionSelectionState) => state.dimensionGroupStates,
            (dimensionGroupStates): AllGroupLoadErrors =>
                Object.entries(dimensionGroupStates).reduce<AllGroupLoadErrors>(
                    (allErrors, [key, dimensionGroupState]) => {
                        if (dimensionGroupState.error) {
                            allErrors.push({
                                groupKey: key,
                                error: dimensionGroupState.error,
                            })
                        }
                        return allErrors
                    },
                    []
                )
        ),
        isDimensionGroupCollapsed: (state, key: string) =>
            state.dimensionGroupStates[key]?.isCollapsed ?? false,
        isDimensionGroupLoading: (state, key: string) =>
            state.dimensionGroupStates[key]?.isLoading ?? false,
        getDimensionGroupError: (state, key: string) =>
            state.dimensionGroupStates[key]?.error,
        isMultiSelecting: (state) => state.multiSelectedDimensionIds.length > 1,
        isDimensionMultiSelected: (state, dimensionId: string) =>
            state.multiSelectedDimensionIds.includes(dimensionId),
    },
})

export const {
    clearDataSourceId,
    setDataSourceId,
    clearSearchTerm,
    setSearchTerm,
    clearFilter,
    setFilter,
    toggleAllDimensionGroupsIsCollapsed,
    clearDimensionGroupStates,
    removeDimensionGroupState,
    addDimensionGroupState,
    toggleDimensionGroupIsCollapsed,
    setDimensionGroupLoadStart,
    setDimensionGroupLoadError,
    setDimensionGroupLoadSuccess,
    clearMultiSelection,
    addItemToMultiSelection,
    removeItemFromMultiSelection,
} = dimensionSelectionSlice.actions
export const {
    getDataSourceId,
    isSelectedDataSourceId,
    getSearchTerm,
    getFilter,
    areAllDimensionGroupsCollapsed,
    isAnyDimensionGroupLoading,
    getAllDimensionGroupLoadErrors,
    isDimensionGroupCollapsed,
    isDimensionGroupLoading,
    getDimensionGroupError,
    isMultiSelecting,
    isDimensionMultiSelected,
} = dimensionSelectionSlice.selectors
