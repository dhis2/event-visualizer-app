import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { EngineError } from '@api/parse-engine-error'
import type { DataSource } from '@types'

type ListLoadingState = {
    isLoading: boolean
    error?: EngineError
}
type AllListsLoadErrors = Array<{ groupKey: string; error: EngineError }>

export interface DimensionSelectionState {
    dataSource: DataSource | null
    searchTerm: string
    // TODO: update to a string literal once all allowed filter strings are known
    filter: string | null
    isAllCollapsed: boolean
    // TODO: update to a string literal once all dimension-lists identifiers are known
    listsLoadingStates: Record<string, ListLoadingState>
    multiSelectedDimensionIds: Array<string>
}

export const initialState: DimensionSelectionState = {
    dataSource: null,
    searchTerm: '',
    filter: null,
    isAllCollapsed: false,
    listsLoadingStates: {},
    multiSelectedDimensionIds: [],
}

export const dimensionSelectionSlice = createSlice({
    name: 'dimensionSelection',
    initialState,
    reducers: {
        clearDataSource: (state) => {
            state.dataSource = null
        },
        setDataSource: (state, action: PayloadAction<DataSource>) => {
            state.dataSource = action.payload
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
        setFilter: (state, action: PayloadAction<string>) => {
            state.filter = action.payload
        },
        toggleAllCollapsed: (state) => {
            state.isAllCollapsed = !state.isAllCollapsed
        },
        clearListsLoadingStates: (state) => {
            state.listsLoadingStates = initialState.listsLoadingStates
        },
        removeListsLoadingState: (state, action: PayloadAction<string>) => {
            delete state.listsLoadingStates[action.payload]
        },
        addListsLoadingState: (state, action: PayloadAction<string>) => {
            state.listsLoadingStates[action.payload] = { isLoading: false }
        },
        setListLoadingStart: (state, action: PayloadAction<string>) => {
            // TODO: error is cleared when loading starts, is that what we want?
            state.listsLoadingStates[action.payload] = { isLoading: true }
        },
        setListLoadingError: (
            state,
            action: PayloadAction<{ id: string; error: EngineError }>
        ) => {
            state.listsLoadingStates[action.payload.id] = {
                isLoading: false,
                error: action.payload.error,
            }
        },
        setListLoadingSuccess: (state, action: PayloadAction<string>) => {
            state.listsLoadingStates[action.payload] = { isLoading: false }
        },
        clearMultiSelection: (state) => {
            state.multiSelectedDimensionIds = []
        },
        addItemToMultiSelection: (state, action: PayloadAction<string>) => {
            state.multiSelectedDimensionIds.push(action.payload)
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
        getDataSource: (state) => state.dataSource,
        getSearchTerm: (state) => state.searchTerm,
        getFilter: (state) => state.filter,
        getIsAllCollapsed: (state) => state.isAllCollapsed,
        isAnyListLoading: createSelector(
            (state: DimensionSelectionState) => state.listsLoadingStates,
            (listsLoadingStates) =>
                Object.values(listsLoadingStates).some(
                    (listLoadingState) => listLoadingState.isLoading
                )
        ),
        getAllListLoadErrors: createSelector(
            (state: DimensionSelectionState) => state.listsLoadingStates,
            (listsLoadingStates): AllListsLoadErrors =>
                Object.entries(listsLoadingStates).reduce<AllListsLoadErrors>(
                    (allErrors, [key, listLoadingState]) => {
                        if (listLoadingState.error) {
                            allErrors.push({
                                groupKey: key,
                                error: listLoadingState.error,
                            })
                        }
                        return allErrors
                    },
                    []
                )
        ),
        isListLoading: (state, key: string) =>
            state.listsLoadingStates[key]?.isLoading ?? false,
        getListError: (state, key: string) =>
            state.listsLoadingStates[key]?.error,
        isMultiSelecting: (state) => state.multiSelectedDimensionIds.length > 1,
        isDimensionMultiSelected: (state, dimensionId: string) =>
            state.multiSelectedDimensionIds.includes(dimensionId),
    },
})

export const {
    clearDataSource,
    setDataSource,
    clearSearchTerm,
    setSearchTerm,
    clearFilter,
    setFilter,
    toggleAllCollapsed,
    clearListsLoadingStates,
    removeListsLoadingState,
    addListsLoadingState,
    setListLoadingStart,
    setListLoadingError,
    setListLoadingSuccess,
    clearMultiSelection,
    addItemToMultiSelection,
    removeItemFromMultiSelection,
} = dimensionSelectionSlice.actions
export const {
    getDataSource,
    getSearchTerm,
    getFilter,
    getIsAllCollapsed,
    isAnyListLoading,
    getAllListLoadErrors,
    isListLoading,
    getListError,
    isMultiSelecting,
    isDimensionMultiSelected,
} = dimensionSelectionSlice.selectors
