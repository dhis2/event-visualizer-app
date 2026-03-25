import { act, renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useListFetchState, type ListFetchState } from '../use-list-fetch-state'
import type { EngineError } from '@api/parse-engine-error'
import type { DimensionMetadataItem } from '@types'

const mockDimension: DimensionMetadataItem = {
    id: 'test-id',
    dimensionId: 'test-id',
    name: 'Test Dimension',
    dimensionType: 'CATEGORY',
    valueType: 'TEXT',
    optionSetId: undefined,
    legendSetId: undefined,
}

const mockEngineError: EngineError = {
    type: 'runtime',
    message: 'Test error',
    httpStatusCode: 500,
    httpStatus: 'Internal Server Error',
    errorCode: 'E5000',
}

describe('useListFetchState', () => {
    it('should initialize with default state', () => {
        const { result } = renderHook(() => useListFetchState())

        expect(result.current.fetchState).toEqual({
            isUninitialized: true,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: false,
        })
    })

    it('should initialize with custom initial state', () => {
        const customInitialState: ListFetchState = {
            isUninitialized: false,
            isLoading: true,
            isFetching: true,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension],
            nextPage: 2,
            error: undefined,
            hasNoData: false,
        }

        const { result } = renderHook(() =>
            useListFetchState(customInitialState)
        )

        expect(result.current.fetchState).toEqual(customInitialState)
    })

    it('should handle FETCH_START for first page', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: true, // First page load should set isLoading to true
            isFetching: true,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: false,
        })
    })

    it('should handle FETCH_START for subsequent pages', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension],
            nextPage: 2,
            error: undefined,
            hasNoData: false,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        act(() => {
            result.current.onFetchStart(2)
        })

        expect(result.current.fetchState).toEqual({
            ...initialState,
            isFetching: true,
            isFetchingMore: true, // Page > 1 should set isFetchingMore to true
            error: undefined,
        })
    })

    it('should handle FETCH_SUCCESS for first page with data', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [mockDimension],
                currentPage: 1,
                nextPage: 2,
                searchTerm: '',
            })
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension],
            nextPage: 2,
            error: undefined,
            hasNoData: false, // Has data, so hasNoData should be false
        })
    })

    it('should handle FETCH_SUCCESS for first page with no data and no search term', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [],
                currentPage: 1,
                nextPage: null,
                searchTerm: '',
            })
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: true, // No data, no search term, page 1
        })
    })

    it('should handle FETCH_SUCCESS for first page with no data but with search term', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [],
                currentPage: 1,
                nextPage: null,
                searchTerm: 'test search',
            })
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: false, // Has search term, so hasNoData should be false
        })
    })

    it('should handle FETCH_SUCCESS for second page (append data)', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension],
            nextPage: 2,
            error: undefined,
            hasNoData: false,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        const secondDimension: DimensionMetadataItem = {
            ...mockDimension,
            id: 'test-id-2',
            name: 'Test Dimension 2',
        }

        act(() => {
            result.current.onFetchStart(2)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [secondDimension],
                currentPage: 2,
                nextPage: 3,
                searchTerm: '',
            })
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension, secondDimension], // Should append
            nextPage: 3,
            error: undefined,
            hasNoData: false,
        })
    })

    it('should handle FETCH_SUCCESS for first page after having data (replace data)', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [mockDimension],
            nextPage: 2,
            error: undefined,
            hasNoData: false,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        const newDimension: DimensionMetadataItem = {
            ...mockDimension,
            id: 'new-id',
            name: 'New Dimension',
        }

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [newDimension],
                currentPage: 1,
                nextPage: 2,
                searchTerm: '',
            })
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [newDimension], // Should replace, not append
            nextPage: 2,
            error: undefined,
            hasNoData: false,
        })
    })

    it('should handle FETCH_ERROR', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchError(mockEngineError)
        })

        expect(result.current.fetchState).toEqual({
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: mockEngineError,
            hasNoData: false,
        })
    })

    it('should clear error on FETCH_START', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: mockEngineError,
            hasNoData: false,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        act(() => {
            result.current.onFetchStart(1)
        })

        expect(result.current.fetchState.error).toBeUndefined()
    })

    it('should clear error on FETCH_SUCCESS', () => {
        const { result } = renderHook(() => useListFetchState())

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchError(mockEngineError)
        })

        expect(result.current.fetchState.error).toEqual(mockEngineError)

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [mockDimension],
                currentPage: 1,
                nextPage: 2,
                searchTerm: '',
            })
        })

        expect(result.current.fetchState.error).toBeUndefined()
    })

    it('should preserve hasNoData state when search term is present', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: true,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [],
                currentPage: 1,
                nextPage: null,
                searchTerm: 'test search',
            })
        })

        expect(result.current.fetchState.hasNoData).toBe(true) // Should preserve from initialState
    })

    it('should preserve hasNoData when search term is present even if data is found', () => {
        const initialState: ListFetchState = {
            isUninitialized: false,
            isLoading: false,
            isFetching: false,
            isFetchingMore: false,
            fetchedDimensions: [],
            nextPage: null,
            error: undefined,
            hasNoData: true,
        }

        const { result } = renderHook(() => useListFetchState(initialState))

        act(() => {
            result.current.onFetchStart(1)
        })

        act(() => {
            result.current.onFetchSuccess({
                dimensions: [mockDimension],
                currentPage: 1,
                nextPage: 2,
                searchTerm: 'test search',
            })
        })

        // When search term is present, hasNoData preserves previous state
        // This matches the reducer logic: !searchTerm ? dimensions.length === 0 : state.hasNoData
        expect(result.current.fetchState.hasNoData).toBe(true)
    })
})
