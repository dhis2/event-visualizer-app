import { describe, it, expect } from 'vitest'
import {
    dimensionSelectionSlice,
    initialState,
    initialListLoadingState,
    type DimensionSelectionState,
    clearDataSourceId,
    setDataSourceId,
    clearSearchTerm,
    setSearchTerm,
    clearFilter,
    setFilter,
    toggleAllDimensionCardsIsCollapsed,
    clearDimensionCardCollapseStates,
    clearDimensionListLoadingStates,
    removeDimensionCardCollapseState,
    removeDimensionListLoadingState,
    addDimensionCardCollapseState,
    addDimensionListLoadingState,
    toggleDimensionCardIsCollapsed,
    setDimensionListLoadStart,
    setDimensionListLoadError,
    setDimensionListLoadSuccess,
    clearMultiSelection,
    addItemToMultiSelection,
    removeItemFromMultiSelection,
    getSearchTerm,
    getDataSourceId,
    isSelectedDataSourceId,
    getFilter,
    areAllDimensionCardsCollapsed,
    isAnyDimensionListLoading,
    getAllDimensionListLoadErrors,
    isDimensionCardCollapsed,
    isDimensionListLoading,
    getDimensionListError,
    isMultiSelecting,
    isDimensionMultiSelected,
} from '../dimensions-selection-slice'
import type { EngineError } from '@api/parse-engine-error'
import type { DimensionCardKey, DimensionListKey } from '@types'

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
                filter: 'ORGANISATION_UNIT',
            }
            const state = reducer(prevstate, clearFilter())
            expect(state.filter).toBe(null)
        })

        it('should set filter', () => {
            const state = reducer(initialState, setFilter('PERIOD'))
            expect(state.filter).toBe('PERIOD')
        })

        it('should toggle all collapsed when groups exist', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionCardCollapseStates: {
                    metadata: false,
                    other: false,
                },
            }

            // First toggle: should collapse all
            let state = reducer(prevState, toggleAllDimensionCardsIsCollapsed())
            expect(state.dimensionCardCollapseStates.metadata).toBe(true)
            expect(state.dimensionCardCollapseStates.other).toBe(true)

            // Second toggle: should expand all
            state = reducer(state, toggleAllDimensionCardsIsCollapsed())
            expect(state.dimensionCardCollapseStates.metadata).toBe(false)
            expect(state.dimensionCardCollapseStates.other).toBe(false)
        })

        it('should handle toggle all collapsed when some groups are collapsed', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionCardCollapseStates: {
                    metadata: true,
                    other: false,
                },
            }

            // Not all collapsed, so should collapse all
            const state = reducer(
                prevState,
                toggleAllDimensionCardsIsCollapsed()
            )
            expect(state.dimensionCardCollapseStates.metadata).toBe(true)
            expect(state.dimensionCardCollapseStates.other).toBe(true)
        })

        it('should do nothing when toggling all collapsed with no groups', () => {
            const state = reducer(
                initialState,
                toggleAllDimensionCardsIsCollapsed()
            )
            expect(state.dimensionCardCollapseStates).toEqual({})
        })

        it('should clear dimension card collapse states', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionCardCollapseStates: {
                    metadata: true,
                },
            }
            const state = reducer(prevState, clearDimensionCardCollapseStates())
            expect(state.dimensionCardCollapseStates).toEqual({})
        })

        it('should clear dimension list loading states', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionListLoadingStates: {
                    other: { isLoading: true, error: undefined },
                },
            }
            const state = reducer(prevState, clearDimensionListLoadingStates())
            expect(state.dimensionListLoadingStates).toEqual({})
        })

        it('should remove dimension card collapse state', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionCardCollapseStates: {
                    metadata: false,
                    other: true,
                },
            }
            const state = reducer(
                prevState,
                removeDimensionCardCollapseState('metadata')
            )
            expect(state.dimensionCardCollapseStates).toEqual({
                other: true,
            })
        })

        it('should remove dimension list loading state', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionListLoadingStates: {
                    other: { isLoading: true, error: undefined },
                    'program-indicators': {
                        isLoading: false,
                        error: undefined,
                    },
                },
            }
            const state = reducer(
                prevState,
                removeDimensionListLoadingState('other')
            )
            expect(state.dimensionListLoadingStates).toEqual({
                'program-indicators': { isLoading: false, error: undefined },
            })
        })

        it('should add dimension card collapse state with initial value', () => {
            const state = reducer(
                initialState,
                addDimensionCardCollapseState('metadata')
            )
            expect(state.dimensionCardCollapseStates).toEqual({
                metadata: false,
            })
        })

        it('should add dimension list loading state with initial value', () => {
            const state = reducer(
                initialState,
                addDimensionListLoadingState('other')
            )
            expect(state.dimensionListLoadingStates).toEqual({
                other: initialListLoadingState,
            })
        })

        it('should toggle dimension card collapsed state', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionCardCollapseStates: {
                    metadata: false,
                },
            }

            // First toggle: false -> true
            let state = reducer(
                prevState,
                toggleDimensionCardIsCollapsed('metadata')
            )
            expect(state.dimensionCardCollapseStates.metadata).toBe(true)

            // Second toggle: true -> false
            state = reducer(state, toggleDimensionCardIsCollapsed('metadata'))
            expect(state.dimensionCardCollapseStates.metadata).toBe(false)
        })

        it('should throw error when toggling non-existent dimension card', () => {
            expect(() =>
                reducer(
                    initialState,
                    toggleDimensionCardIsCollapsed('metadata')
                )
            ).toThrow('Card collapse state for "metadata" is not initialized')
        })

        it('should set dimension list load start', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionListLoadingStates: {
                    other: {
                        isLoading: false,
                        error: { message: 'old error', type: 'runtime' },
                    },
                },
            }

            const state = reducer(prevState, setDimensionListLoadStart('other'))
            expect(state.dimensionListLoadingStates.other!.isLoading).toBe(true)
            expect(
                state.dimensionListLoadingStates.other!.error
            ).toBeUndefined()
        })

        it('should throw error when setting load start for non-existent dimension list', () => {
            expect(() =>
                reducer(
                    initialState,
                    setDimensionListLoadStart('other' as DimensionListKey)
                )
            ).toThrow('List loading state for "other" is not initialized')
        })

        it('should set dimension list load error', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionListLoadingStates: {
                    other: { isLoading: true, error: undefined },
                },
            }
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = reducer(
                prevState,
                setDimensionListLoadError({ id: 'other', error })
            )
            expect(state.dimensionListLoadingStates.other!.isLoading).toBe(
                false
            )
            expect(state.dimensionListLoadingStates.other!.error).toEqual(error)
        })

        it('should throw error when setting load error for non-existent dimension list', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }
            expect(() =>
                reducer(
                    initialState,
                    setDimensionListLoadError({
                        id: 'other' as DimensionListKey,
                        error,
                    })
                )
            ).toThrow('List loading state for "other" is not initialized')
        })

        it('should set dimension list load success', () => {
            const prevState: DimensionSelectionState = {
                ...initialState,
                dimensionListLoadingStates: {
                    other: { isLoading: true, error: undefined },
                },
            }

            const state = reducer(
                prevState,
                setDimensionListLoadSuccess('other')
            )
            expect(state.dimensionListLoadingStates.other!.isLoading).toBe(
                false
            )
            expect(
                state.dimensionListLoadingStates.other!.error
            ).toBeUndefined()
        })

        it('should throw error when setting load success for non-existent dimension list', () => {
            expect(() =>
                reducer(
                    initialState,
                    setDimensionListLoadSuccess('other' as DimensionListKey)
                )
            ).toThrow('List loading state for "other" is not initialized')
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
            const state = createRootState({ filter: 'DATA_ELEMENT' })
            expect(getFilter(state)).toBe('DATA_ELEMENT')
        })

        it('should get are all dimension cards collapsed when all are collapsed', () => {
            const state = createRootState({
                dimensionCardCollapseStates: {
                    metadata: true,
                    other: true,
                },
            })
            expect(areAllDimensionCardsCollapsed(state)).toBe(true)
        })

        it('should get are all dimension cards collapsed when some are not collapsed', () => {
            const state = createRootState({
                dimensionCardCollapseStates: {
                    metadata: true,
                    other: false,
                },
            })
            expect(areAllDimensionCardsCollapsed(state)).toBe(false)
        })

        it('should get are all dimension cards collapsed when none exist', () => {
            const state = createRootState({
                dimensionCardCollapseStates: {},
            })
            expect(areAllDimensionCardsCollapsed(state)).toBe(false)
        })

        it('should detect if any dimension list is loading', () => {
            const stateWithLoading = createRootState({
                dimensionListLoadingStates: {
                    other: { isLoading: false, error: undefined },
                    'program-indicators': {
                        isLoading: true,
                        error: undefined,
                    },
                },
            })
            expect(isAnyDimensionListLoading(stateWithLoading)).toBe(true)

            const stateWithoutLoading = createRootState({
                dimensionListLoadingStates: {
                    other: { isLoading: false, error: undefined },
                    'program-indicators': {
                        isLoading: false,
                        error: undefined,
                    },
                },
            })
            expect(isAnyDimensionListLoading(stateWithoutLoading)).toBe(false)
        })

        it('should get all dimension list load errors', () => {
            const error1: EngineError = {
                message: 'error 1',
                type: 'runtime',
            }
            const error2: EngineError = {
                message: 'error 2',
                type: 'runtime',
            }

            const state = createRootState({
                dimensionListLoadingStates: {
                    other: {
                        isLoading: false,
                        error: error1,
                    },
                    'program-indicators': {
                        isLoading: false,
                        error: undefined,
                    },
                    'tracked-entity-type': {
                        isLoading: false,
                        error: error2,
                    },
                },
            })

            const errors = getAllDimensionListLoadErrors(state)
            expect(errors).toEqual([
                { listKey: 'other', error: error1 },
                { listKey: 'tracked-entity-type', error: error2 },
            ])
        })

        it('should check if dimension card is collapsed', () => {
            const state = createRootState({
                dimensionCardCollapseStates: {
                    metadata: true,
                    other: false,
                },
            })

            expect(
                isDimensionCardCollapsed(state, 'metadata' as DimensionCardKey)
            ).toBe(true)
            expect(
                isDimensionCardCollapsed(state, 'other' as DimensionCardKey)
            ).toBe(false)
            expect(
                isDimensionCardCollapsed(
                    state,
                    'enrollment' as DimensionCardKey
                )
            ).toBe(false)
        })

        it('should check if dimension list is loading', () => {
            const state = createRootState({
                dimensionListLoadingStates: {
                    other: { isLoading: true, error: undefined },
                    'program-indicators': {
                        isLoading: false,
                        error: undefined,
                    },
                },
            })

            expect(
                isDimensionListLoading(state, 'other' as DimensionListKey)
            ).toBe(true)
            expect(
                isDimensionListLoading(
                    state,
                    'program-indicators' as DimensionListKey
                )
            ).toBe(false)
            expect(
                isDimensionListLoading(state, 'metadata' as DimensionListKey)
            ).toBe(false)
        })

        it('should get dimension list error', () => {
            const error: EngineError = {
                message: 'test error',
                type: 'runtime',
            }

            const state = createRootState({
                dimensionListLoadingStates: {
                    other: { isLoading: false, error },
                    'program-indicators': {
                        isLoading: false,
                        error: undefined,
                    },
                },
            })

            expect(
                getDimensionListError(state, 'other' as DimensionListKey)
            ).toEqual(error)
            expect(
                getDimensionListError(
                    state,
                    'program-indicators' as DimensionListKey
                )
            ).toBeUndefined()
            expect(
                getDimensionListError(state, 'metadata' as DimensionListKey)
            ).toBeUndefined()
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
