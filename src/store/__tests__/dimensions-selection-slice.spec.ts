import { describe, it, expect } from 'vitest'
import {
    dimensionSelectionSlice,
    initialState,
    initialDimensionGroupState,
    type DimensionSelectionState,
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
    getSearchTerm,
    getDataSourceId,
    isSelectedDataSourceId,
    getFilter,
    areAllDimensionGroupsCollapsed,
    isAnyDimensionGroupLoading,
    getAllDimensionGroupLoadErrors,
    isDimensionGroupCollapsed,
    isDimensionGroupLoading,
    getDimensionGroupError,
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

        it('should toggle all collapsed when groups exist', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    group1: { isCollapsed: false, isLoading: false },
                    group2: { isCollapsed: false, isLoading: false },
                },
            }

            // First toggle: should collapse all
            let state = reducer(
                prevState,
                toggleAllDimensionGroupsIsCollapsed()
            )
            expect(state.dimensionGroupStates.group1.isCollapsed).toBe(true)
            expect(state.dimensionGroupStates.group2.isCollapsed).toBe(true)

            // Second toggle: should expand all
            state = reducer(state, toggleAllDimensionGroupsIsCollapsed())
            expect(state.dimensionGroupStates.group1.isCollapsed).toBe(false)
            expect(state.dimensionGroupStates.group2.isCollapsed).toBe(false)
        })

        it('should handle toggle all collapsed when some groups are collapsed', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    group1: { isCollapsed: true, isLoading: false },
                    group2: { isCollapsed: false, isLoading: false },
                },
            }

            // Not all collapsed, so should collapse all
            const state = reducer(
                prevState,
                toggleAllDimensionGroupsIsCollapsed()
            )
            expect(state.dimensionGroupStates.group1.isCollapsed).toBe(true)
            expect(state.dimensionGroupStates.group2.isCollapsed).toBe(true)
        })

        it('should do nothing when toggling all collapsed with no groups', () => {
            const state = reducer(
                initialState,
                toggleAllDimensionGroupsIsCollapsed()
            )
            expect(state.dimensionGroupStates).toEqual({})
        })

        it('should clear dimension group states', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: { isCollapsed: false, isLoading: true },
                },
            }
            const state = reducer(prevState, clearDimensionGroupStates())
            expect(state.dimensionGroupStates).toEqual({})
        })

        it('should remove dimension group state', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: { isCollapsed: false, isLoading: true },
                    keep: { isCollapsed: true, isLoading: false },
                },
            }
            const state = reducer(prevState, removeDimensionGroupState('test'))
            expect(state.dimensionGroupStates).toEqual({
                keep: { isCollapsed: true, isLoading: false },
            })
        })

        it('should add dimension group state with initial values', () => {
            const state = reducer(initialState, addDimensionGroupState('test'))
            expect(state.dimensionGroupStates).toEqual({
                test: initialDimensionGroupState,
            })
        })

        it('should toggle dimension group collapsed state', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: { isCollapsed: false, isLoading: false },
                },
            }

            // First toggle: false -> true
            let state = reducer(
                prevState,
                toggleDimensionGroupIsCollapsed('test')
            )
            expect(state.dimensionGroupStates.test.isCollapsed).toBe(true)

            // Second toggle: true -> false
            state = reducer(state, toggleDimensionGroupIsCollapsed('test'))
            expect(state.dimensionGroupStates.test.isCollapsed).toBe(false)
        })

        it('should throw error when toggling non-existent dimension group', () => {
            expect(() =>
                reducer(
                    initialState,
                    toggleDimensionGroupIsCollapsed('nonExistent')
                )
            ).toThrow('Dimension group nonExistent does not exist')
        })

        it('should set dimension group load start', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: {
                        isCollapsed: false,
                        isLoading: false,
                        error: { message: 'old error', type: 'runtime' },
                    },
                },
            }

            const state = reducer(prevState, setDimensionGroupLoadStart('test'))
            expect(state.dimensionGroupStates.test.isLoading).toBe(true)
            expect(state.dimensionGroupStates.test.error).toBeUndefined()
        })

        it('should throw error when setting load start for non-existent dimension group', () => {
            expect(() =>
                reducer(initialState, setDimensionGroupLoadStart('nonExistent'))
            ).toThrow('Dimension group nonExistent does not exist')
        })

        it('should set dimension group load error', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: { isCollapsed: false, isLoading: true },
                },
            }
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = reducer(
                prevState,
                setDimensionGroupLoadError({ id: 'test', error })
            )
            expect(state.dimensionGroupStates.test.isLoading).toBe(false)
            expect(state.dimensionGroupStates.test.error).toEqual(error)
        })

        it('should throw error when setting load error for non-existent dimension group', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }
            expect(() =>
                reducer(
                    initialState,
                    setDimensionGroupLoadError({ id: 'nonExistent', error })
                )
            ).toThrow('Dimension group nonExistent does not exist')
        })

        it('should set dimension group load success', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionGroupStates: {
                    test: { isCollapsed: false, isLoading: true },
                },
            }

            const state = reducer(
                prevState,
                setDimensionGroupLoadSuccess('test')
            )
            expect(state.dimensionGroupStates.test.isLoading).toBe(false)
        })

        it('should throw error when setting load success for non-existent dimension group', () => {
            expect(() =>
                reducer(
                    initialState,
                    setDimensionGroupLoadSuccess('nonExistent')
                )
            ).toThrow('Dimension group nonExistent does not exist')
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
            expect(isSelectedDataSourceId(state, 'test')).toEqual(true)
        })

        it('should get search term', () => {
            const state = createRootState({ searchTerm: 'test' })
            expect(getSearchTerm(state)).toBe('test')
        })

        it('should get filter', () => {
            const state = createRootState({ filter: 'DATA_ELEMENTS' })
            expect(getFilter(state)).toBe('DATA_ELEMENTS')
        })

        it('should get are all dimension groups collapsed when all are collapsed', () => {
            const state = createRootState({
                dimensionGroupStates: {
                    group1: { isCollapsed: true, isLoading: false },
                    group2: { isCollapsed: true, isLoading: false },
                },
            })
            expect(areAllDimensionGroupsCollapsed(state)).toBe(true)
        })

        it('should get are all dimension groups collapsed when some are not collapsed', () => {
            const state = createRootState({
                dimensionGroupStates: {
                    group1: { isCollapsed: true, isLoading: false },
                    group2: { isCollapsed: false, isLoading: false },
                },
            })
            expect(areAllDimensionGroupsCollapsed(state)).toBe(false)
        })

        it('should get are all dimension groups collapsed when none exist', () => {
            const state = createRootState({
                dimensionGroupStates: {},
            })
            expect(areAllDimensionGroupsCollapsed(state)).toBe(false)
        })

        it('should detect if any dimension group is loading', () => {
            const stateWithLoading = createRootState({
                dimensionGroupStates: {
                    group1: { isCollapsed: false, isLoading: false },
                    group2: { isCollapsed: false, isLoading: true },
                },
            })
            expect(isAnyDimensionGroupLoading(stateWithLoading)).toBe(true)

            const stateWithoutLoading = createRootState({
                dimensionGroupStates: {
                    group1: { isCollapsed: false, isLoading: false },
                    group2: { isCollapsed: false, isLoading: false },
                },
            })
            expect(isAnyDimensionGroupLoading(stateWithoutLoading)).toBe(false)
        })

        it('should get all dimension group load errors', () => {
            const error1: EngineError = {
                message: 'error 1',
                type: 'runtime',
            }
            const error2: EngineError = {
                message: 'error 2',
                type: 'runtime',
            }

            const state = createRootState({
                dimensionGroupStates: {
                    group1: {
                        isCollapsed: false,
                        isLoading: false,
                        error: error1,
                    },
                    group2: { isCollapsed: false, isLoading: false },
                    group3: {
                        isCollapsed: false,
                        isLoading: false,
                        error: error2,
                    },
                },
            })

            const errors = getAllDimensionGroupLoadErrors(state)
            expect(errors).toEqual([
                { groupKey: 'group1', error: error1 },
                { groupKey: 'group3', error: error2 },
            ])
        })

        it('should check if dimension group is collapsed', () => {
            const state = createRootState({
                dimensionGroupStates: {
                    collapsed: { isCollapsed: true, isLoading: false },
                    notCollapsed: { isCollapsed: false, isLoading: false },
                },
            })

            expect(isDimensionGroupCollapsed(state, 'collapsed')).toBe(true)
            expect(isDimensionGroupCollapsed(state, 'notCollapsed')).toBe(false)
            expect(isDimensionGroupCollapsed(state, 'nonExistent')).toBe(false)
        })

        it('should check if dimension group is loading', () => {
            const state = createRootState({
                dimensionGroupStates: {
                    loading: { isCollapsed: false, isLoading: true },
                    notLoading: { isCollapsed: false, isLoading: false },
                },
            })

            expect(isDimensionGroupLoading(state, 'loading')).toBe(true)
            expect(isDimensionGroupLoading(state, 'notLoading')).toBe(false)
            expect(isDimensionGroupLoading(state, 'nonExistent')).toBe(false)
        })

        it('should get dimension group error', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = createRootState({
                dimensionGroupStates: {
                    withError: { isCollapsed: false, isLoading: false, error },
                    withoutError: { isCollapsed: false, isLoading: false },
                },
            })

            expect(getDimensionGroupError(state, 'withError')).toEqual(error)
            expect(
                getDimensionGroupError(state, 'withoutError')
            ).toBeUndefined()
            expect(getDimensionGroupError(state, 'nonExistent')).toBeUndefined()
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
