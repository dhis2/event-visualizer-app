import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { EngineError } from '@api/parse-engine-error'
import { isObject } from '@modules/validation'
import type {
    DataSourceFilter,
    DimensionCardKey,
    DimensionListKey,
} from '@types'

type DimensionCardCollapseStates = Partial<Record<DimensionCardKey, boolean>>
type DimensionListLoadingState = {
    isLoading: boolean
    error?: EngineError
}
type DimensionListLoadingStates = Partial<
    Record<DimensionListKey, DimensionListLoadingState>
>
type AllListLoadErrors = Array<{ listKey: string; error: EngineError }>

export interface DimensionSelectionState {
    dataSourceId: string | null
    searchTerm: string
    filter: DataSourceFilter | null
    dimensionCardCollapseStates: DimensionCardCollapseStates
    dimensionListLoadingStates: DimensionListLoadingStates
    multiSelectedDimensionIds: Array<string>
}

export const initialState: DimensionSelectionState = {
    dataSourceId: null,
    searchTerm: '',
    filter: null,
    dimensionCardCollapseStates: {},
    dimensionListLoadingStates: {},
    multiSelectedDimensionIds: [],
}

export const initialListLoadingState: DimensionListLoadingState = {
    isLoading: false,
    error: undefined,
}

const isValidCardCollapseState = (state: unknown): state is boolean =>
    typeof state === 'boolean'

const isValidListLoadingState = (
    state: unknown
): state is DimensionListLoadingState =>
    isObject(state) &&
    'isLoading' in state &&
    typeof (state as DimensionListLoadingState).isLoading === 'boolean'

const getDimensionListLoadingStateErrorMessage = (key: string) =>
    `List loading state for "${key}" is not initialized. Call addDimensionListLoadingState first.`

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
        clearDimensionCardCollapseStates: (state) => {
            state.dimensionCardCollapseStates =
                initialState.dimensionCardCollapseStates
        },
        clearDimensionListLoadingStates: (state) => {
            state.dimensionListLoadingStates =
                initialState.dimensionListLoadingStates
        },
        removeDimensionCardCollapseState: (
            state,
            action: PayloadAction<DimensionCardKey>
        ) => {
            delete state.dimensionCardCollapseStates[action.payload]
        },
        removeDimensionListLoadingState: (
            state,
            action: PayloadAction<DimensionListKey>
        ) => {
            delete state.dimensionListLoadingStates[action.payload]
        },
        addDimensionCardCollapseState: (
            state,
            action: PayloadAction<DimensionCardKey>
        ) => {
            state.dimensionCardCollapseStates[action.payload] = false
        },
        addDimensionListLoadingState: (
            state,
            action: PayloadAction<DimensionListKey>
        ) => {
            state.dimensionListLoadingStates[action.payload] =
                initialListLoadingState
        },
        toggleAllDimensionCardsIsCollapsed: (state) => {
            const dimensionCardCollapsedStatesKeys = Object.keys(
                state.dimensionCardCollapseStates
            )
            // When there are no groups, they cannot be collapsed
            if (dimensionCardCollapsedStatesKeys.length === 0) {
                return
            }
            const areAllCollapsed = dimensionCardCollapsedStatesKeys.every(
                (key) => state.dimensionCardCollapseStates[key]
            )
            dimensionCardCollapsedStatesKeys.forEach((key) => {
                state.dimensionCardCollapseStates[key] = !areAllCollapsed
            })
        },
        toggleDimensionCardIsCollapsed: (
            state,
            action: PayloadAction<DimensionCardKey>
        ) => {
            const collapseState =
                state.dimensionCardCollapseStates[action.payload]
            if (!isValidCardCollapseState(collapseState)) {
                throw new Error(
                    `Card collapse state for "${action.payload}" is not initialized. Call addDimensionCardCollapseState first.`
                )
            }
            state.dimensionCardCollapseStates[action.payload] = !collapseState
        },
        setDimensionListLoadStart: (
            state,
            action: PayloadAction<DimensionListKey>
        ) => {
            const loadingState =
                state.dimensionListLoadingStates[action.payload]
            if (!isValidListLoadingState(loadingState)) {
                throw new Error(
                    getDimensionListLoadingStateErrorMessage(action.payload)
                )
            }
            loadingState.isLoading = true
            loadingState.error = undefined
        },
        setDimensionListLoadError: (
            state,
            action: PayloadAction<{ id: DimensionListKey; error: EngineError }>
        ) => {
            const loadingState =
                state.dimensionListLoadingStates[action.payload.id]
            if (!isValidListLoadingState(loadingState)) {
                throw new Error(
                    getDimensionListLoadingStateErrorMessage(action.payload.id)
                )
            }
            loadingState.isLoading = false
            loadingState.error = action.payload.error
        },
        setDimensionListLoadSuccess: (
            state,
            action: PayloadAction<DimensionListKey>
        ) => {
            const loadingState =
                state.dimensionListLoadingStates[action.payload]
            if (!isValidListLoadingState(loadingState)) {
                throw new Error(
                    getDimensionListLoadingStateErrorMessage(action.payload)
                )
            }
            loadingState.isLoading = false
            loadingState.error = undefined
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
        areAllDimensionCardsCollapsed: createSelector(
            (state: DimensionSelectionState) =>
                state.dimensionCardCollapseStates,
            (dimensionCardCollapseStates) => {
                const values = Object.values(dimensionCardCollapseStates)
                // When there are no cards, they cannot be collapsed
                if (values.length === 0) {
                    return false
                }
                return values.every(Boolean)
            }
        ),
        isAnyDimensionListLoading: createSelector(
            (state: DimensionSelectionState) =>
                state.dimensionListLoadingStates,
            (dimensionListLoadingStates) =>
                Object.values(dimensionListLoadingStates).some(
                    (dimensionListLoadingState) =>
                        dimensionListLoadingState!.isLoading
                )
        ),
        getAllDimensionListLoadErrors: createSelector(
            (state: DimensionSelectionState) =>
                state.dimensionListLoadingStates,
            (dimensionListLoadingStates): AllListLoadErrors =>
                Object.entries(
                    dimensionListLoadingStates
                ).reduce<AllListLoadErrors>(
                    (allErrors, [key, dimensionListLoadingState]) => {
                        if (dimensionListLoadingState!.error) {
                            allErrors.push({
                                listKey: key,
                                error: dimensionListLoadingState!.error,
                            })
                        }
                        return allErrors
                    },
                    []
                )
        ),
        isDimensionCardCollapsed: (state, key: DimensionCardKey) =>
            !!state.dimensionCardCollapseStates[key],
        isDimensionListLoading: (state, key: DimensionListKey) =>
            state.dimensionListLoadingStates[key]?.isLoading ?? false,
        getDimensionListError: (state, key: DimensionListKey) =>
            state.dimensionListLoadingStates[key]?.error,
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
    clearDimensionCardCollapseStates,
    clearDimensionListLoadingStates,
    removeDimensionCardCollapseState,
    removeDimensionListLoadingState,
    addDimensionCardCollapseState,
    addDimensionListLoadingState,
    toggleAllDimensionCardsIsCollapsed,
    toggleDimensionCardIsCollapsed,
    setDimensionListLoadStart,
    setDimensionListLoadError,
    setDimensionListLoadSuccess,
    clearMultiSelection,
    addItemToMultiSelection,
    removeItemFromMultiSelection,
} = dimensionSelectionSlice.actions
export const {
    getDataSourceId,
    isSelectedDataSourceId,
    getSearchTerm,
    getFilter,
    areAllDimensionCardsCollapsed,
    isAnyDimensionListLoading,
    getAllDimensionListLoadErrors,
    isDimensionCardCollapsed,
    isDimensionListLoading,
    getDimensionListError,
    isMultiSelecting,
    isDimensionMultiSelected,
} = dimensionSelectionSlice.selectors
