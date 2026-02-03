import { describe, it, expect } from 'vitest'
import {
    dimensionSelectionSlice,
    initialState,
    type DimensionSelectionState,
    clearDataSourceId,
    setDataSourceId,
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
    getSearchTerm,
    getDataSourceId,
    getIsSelectedDataSourceId,
    getFilter,
    getIsAllCollapsed,
    isAnyListLoading,
    getAllListLoadErrors,
    isListLoading,
    getListError,
    isMultiSelecting,
    isDimensionMultiSelected,
} from '../dimensions-selection-slice'
import type { EngineError } from '@api/parse-engine-error'

type RootState = {
    dimensionSelection: DimensionSelectionState
}

const createRootState = (
    dimensionSelectionState: Partial<DimensionSelectionState>
): RootState => ({
    dimensionSelection: {
        ...initialState,
        ...dimensionSelectionState,
    },
})

describe('dimensionSelectionSlice', () => {
    const reducer = dimensionSelectionSlice.reducer

    it('should return the initial state', () => {
        expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
    })

    describe('reducers', () => {
        it('should clear data source ID', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                dataSourceId: 'test',
            }

            const state = reducer(prevstate, clearDataSourceId())
            expect(state.dataSourceId).toBe(null)
        })

        it('should set data source', () => {
            const state = reducer(initialState, setDataSourceId('test'))
            expect(state.dataSourceId).toEqual('test')
        })

        it('should clear search term', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                searchTerm: 'test',
            }

            const state = reducer(prevstate, clearSearchTerm())
            expect(state.searchTerm).toBe('')
        })

        it('should set search term', () => {
            const state = reducer(initialState, setSearchTerm('new term'))
            expect(state.searchTerm).toBe('new term')
        })

        it('should clear filter', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                filter: 'ORG_UNITS',
            }
            const state = reducer(prevstate, clearFilter())
            expect(state.filter).toBe(null)
        })

        it('should set filter', () => {
            const state = reducer(initialState, setFilter('PERIODS'))
            expect(state.filter).toBe('PERIODS')
        })

        it('should toggle all collapsed', () => {
            const state = reducer(initialState, toggleAllCollapsed())
            expect(state.isAllCollapsed).toBe(true)
        })

        it('should clear lists loading states', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                listsLoadingStates: { test: { isLoading: true } },
            }
            const state = reducer(prevstate, clearListsLoadingStates())
            expect(state.listsLoadingStates).toEqual({})
        })

        it('should remove lists loading state', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                listsLoadingStates: { test: { isLoading: true } },
            }
            const state = reducer(prevstate, removeListsLoadingState('test'))
            expect(state.listsLoadingStates).toEqual({})
        })

        it('should add lists loading state', () => {
            const state = reducer(initialState, addListsLoadingState('test'))
            expect(state.listsLoadingStates).toEqual({
                test: { isLoading: false },
            })
        })

        it('should set list loading start', () => {
            const state = reducer(initialState, setListLoadingStart('test'))
            expect(state.listsLoadingStates).toEqual({
                test: { isLoading: true },
            })
        })

        it('should set list loading error', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = reducer(
                initialState,
                setListLoadingError({ id: 'test', error })
            )
            expect(state.listsLoadingStates).toEqual({
                test: { isLoading: false, error },
            })
        })

        it('should set list loading success', () => {
            const state = reducer(initialState, setListLoadingSuccess('test'))
            expect(state.listsLoadingStates).toEqual({
                test: { isLoading: false },
            })
        })

        it('should clear multi selection', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                multiSelectedDimensionIds: ['id1', 'id2'],
            }

            const state = reducer(prevstate, clearMultiSelection())
            expect(state.multiSelectedDimensionIds).toEqual([])
        })

        it('should add item to multi selection', () => {
            const state = reducer(initialState, addItemToMultiSelection('id1'))
            expect(state.multiSelectedDimensionIds).toEqual(['id1'])
        })

        it('should not add duplicate item to multi selection', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                multiSelectedDimensionIds: ['id1', 'id2'],
            }

            const state = reducer(prevstate, addItemToMultiSelection('id1'))
            expect(state.multiSelectedDimensionIds).toEqual(['id1', 'id2'])
        })

        it('should remove item from multi selection', () => {
            const prevstate: DimensionSelectionState = {
                ...initialState,
                multiSelectedDimensionIds: ['id1', 'id2'],
            }
            const state = reducer(
                prevstate,
                removeItemFromMultiSelection('id1')
            )
            expect(state.multiSelectedDimensionIds).toEqual(['id2'])
        })
    })

    describe('selectors', () => {
        it('should get data source ID', () => {
            const state = createRootState({ dataSourceId: 'test' })
            expect(getDataSourceId(state)).toEqual('test')
        })

        it('should get is selected data source for a provided data source ID', () => {
            const state = createRootState({ dataSourceId: 'test' })
            expect(getIsSelectedDataSourceId(state, 'test')).toEqual(true)
        })

        it('should get search term', () => {
            const state = createRootState({ searchTerm: 'test' })
            expect(getSearchTerm(state)).toBe('test')
        })

        it('should get filter', () => {
            const state = createRootState({ filter: 'DATA_ELEMENTS' })
            expect(getFilter(state)).toBe('DATA_ELEMENTS')
        })

        it('should get is all collapsed', () => {
            const state = createRootState({ isAllCollapsed: true })
            expect(getIsAllCollapsed(state)).toBe(true)
        })

        it('should detect if any list is loading', () => {
            const stateWithLoading = createRootState({
                listsLoadingStates: {
                    list1: { isLoading: false },
                    list2: { isLoading: true },
                },
            })
            expect(isAnyListLoading(stateWithLoading)).toBe(true)

            const stateWithoutLoading = createRootState({
                listsLoadingStates: {
                    list1: { isLoading: false },
                    list2: { isLoading: false },
                },
            })
            expect(isAnyListLoading(stateWithoutLoading)).toBe(false)
        })

        it('should get all list load errors', () => {
            const error1: EngineError = {
                message: 'error 1',
                type: 'runtime',
            }
            const error2: EngineError = {
                message: 'error 2',
                type: 'runtime',
            }

            const state = createRootState({
                listsLoadingStates: {
                    list1: { isLoading: false, error: error1 },
                    list2: { isLoading: false },
                    list3: { isLoading: false, error: error2 },
                },
            })

            const errors = getAllListLoadErrors(state)
            expect(errors).toEqual([
                { groupKey: 'list1', error: error1 },
                { groupKey: 'list3', error: error2 },
            ])
        })

        it('should check if list is loading', () => {
            const state = createRootState({
                listsLoadingStates: {
                    loading: { isLoading: true },
                    notLoading: { isLoading: false },
                },
            })

            expect(isListLoading(state, 'loading')).toBe(true)
            expect(isListLoading(state, 'notLoading')).toBe(false)
            expect(isListLoading(state, 'nonExistent')).toBe(false)
        })

        it('should get list error', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = createRootState({
                listsLoadingStates: {
                    withError: { isLoading: false, error },
                    withoutError: { isLoading: false },
                },
            })

            expect(getListError(state, 'withError')).toEqual(error)
            expect(getListError(state, 'withoutError')).toBeUndefined()
            expect(getListError(state, 'nonExistent')).toBeUndefined()
        })

        it('should detect multi selecting', () => {
            const stateMultiSelecting = createRootState({
                multiSelectedDimensionIds: ['id1', 'id2'],
            })
            expect(isMultiSelecting(stateMultiSelecting)).toBe(true)

            const stateSingleSelection = createRootState({
                multiSelectedDimensionIds: ['id1'],
            })
            expect(isMultiSelecting(stateSingleSelection)).toBe(false)

            const stateNoSelection = createRootState({
                multiSelectedDimensionIds: [],
            })
            expect(isMultiSelecting(stateNoSelection)).toBe(false)
        })

        it('should check if dimension is multi selected', () => {
            const state = createRootState({
                multiSelectedDimensionIds: ['id1', 'id2', 'id3'],
            })

            expect(isDimensionMultiSelected(state, 'id1')).toBe(true)
            expect(isDimensionMultiSelected(state, 'id2')).toBe(true)
            expect(isDimensionMultiSelected(state, 'id4')).toBe(false)
        })
    })
})
