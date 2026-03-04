import { act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDimensionList, type Transformer } from '..'
import {
    dimensionSelectionSlice,
    setSearchTerm,
    setFilter,
    clearFilter,
} from '@store/dimensions-selection-slice'
import * as dimensionSelectionActions from '@store/dimensions-selection-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import type { DimensionMetadataItem, SingleQuery } from '@types'

// ===== MOCK SETUP =====
let mockApiResponse: unknown = null
let mockApiError: Error | null = null
let mockApiDelay = 10 // Default delay in ms
let mockInitiateCallCount = 0
let lastInitiateQuery: SingleQuery | null = null
let allInitiateQueries: SingleQuery[] = []

// Mock the API
vi.mock('@api/api', () => {
    const createUnwrapPromise = async () => {
        // Use setTimeout with fake timers - will be controlled by vi.advanceTimersByTimeAsync
        await new Promise((resolve) => setTimeout(resolve, mockApiDelay))
        if (mockApiError) {
            throw mockApiError
        }
        return mockApiResponse || {}
    }

    const mockQueryInitiate = vi.fn((query: SingleQuery) => {
        mockInitiateCallCount++
        lastInitiateQuery = query
        allInitiateQueries.push(structuredClone(query))

        return () => ({
            unwrap: vi.fn(createUnwrapPromise),
        })
    })

    return {
        api: {
            injectEndpoints: vi.fn(),
            enhanceEndpoints: vi.fn(),
            reducerPath: 'api',
            endpoints: {
                query: {
                    initiate: mockQueryInitiate,
                },
                mutate: {
                    initiate: vi.fn(),
                },
            },
            internalActions: {},
            util: {},
            reducer: vi.fn((state = {}) => state),
            middleware: vi.fn(() => (next) => (action) => next(action)),
            usePrefetch: vi.fn(),
            useQueryQuery: vi.fn(),
            useLazyQueryQuery: vi.fn(),
            useMutateMutation: vi.fn(),
        },
    }
})

// ===== HELPER FUNCTIONS =====
const createDimension = (
    overrides?: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: 'test-id',
    name: 'Test Dimension',
    dimensionType: 'DATA_ELEMENT',
    dimensionItemType: 'DATA_ELEMENT',
    valueType: 'TEXT',
    ...overrides,
})

// ===== HOOK TESTS WITH FAKE TIMERS =====

describe('useDimensionList - Fake Timers with Real Redux Store', () => {
    beforeEach(() => {
        // Enable fake timers
        vi.useFakeTimers()

        // Reset mock state
        vi.clearAllMocks()
        mockApiResponse = null
        mockApiError = null
        mockApiDelay = 10
        mockInitiateCallCount = 0
        lastInitiateQuery = null
        allInitiateQueries = []
    })

    afterEach(() => {
        // Restore real timers
        vi.useRealTimers()
    })

    // ===== TEST DATA =====
    const mockDimension: DimensionMetadataItem = {
        id: 'test-id',
        name: 'Test Dimension',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    }

    const mockApiDimension: DimensionMetadataItem = {
        id: 'api-id-1',
        name: 'API Dimension 1',
        dimensionType: 'DATA_ELEMENT',
        dimensionItemType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    }

    const baseQuery: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }

    // ===== HELPER FUNCTIONS =====
    /**
     * Helper to create a Redux store with dimensionSelection preloaded state
     */
    const createStoreWithPreloadedState = (
        overrides?: Partial<typeof dimensionSelectionSlice.reducer>
    ) => {
        return setupStore(
            {
                dimensionSelection: dimensionSelectionSlice.reducer,
            },
            {
                dimensionSelection: {
                    dataSourceId: null,
                    searchTerm: '',
                    filter: null,
                    dimensionCardCollapsedStates: {},
                    dimensionListLoadingStates: {},
                    multiSelectedDimensionIds: [],
                    ...overrides,
                },
            }
        )
    }

    /**
     * Helper to render a hook with the Redux store provider and advance timers
     * for initial mount + API delay
     */
    const renderHookAndWaitForInitialLoad = async (
        hook: () => ReturnType<typeof useDimensionList>,
        store: ReturnType<typeof setupStore>
    ) => {
        const renderResult = renderHookWithReduxStoreProvider(hook, store)

        // Advance timers to complete initial fetch (mount effect + API delay)
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        return renderResult
    }

    // ===== BASIC HOOK TESTS =====

    it('returns initial dimensions', async () => {
        const fixedDimensions = [mockDimension]
        const store = createStoreWithPreloadedState()

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                }),
            store
        )

        expect(result.current.dimensions).toEqual(fixedDimensions)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.loadMore).toBeDefined()
        expect(mockInitiateCallCount).toBe(0)
    })

    it('returns empty array without fixedDimensions', async () => {
        const store = createStoreWithPreloadedState()

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                }),
            store
        )

        expect(result.current.dimensions).toEqual([])
        expect(mockInitiateCallCount).toBe(0)
    })

    it('fetches when filter matches dimension type in query', async () => {
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({
            filter: 'DATA_ELEMENT',
        })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Verify final state after fetch completes
        expect(result.current.isLoading).toBe(false)
        expect(result.current.dimensions).toEqual([mockApiDimension])

        expect(mockInitiateCallCount).toBeGreaterThan(0)
        expect(lastInitiateQuery).not.toBeNull()
        expect(lastInitiateQuery?.resource).toBe('dimensions')
        expect(lastInitiateQuery?.params?.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
        ])
    })

    it('does not fetch when filter does not match dimension type in query', async () => {
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({
            filter: 'PROGRAM_INDICATOR',
        })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        expect(result.current.isLoading).toBe(false)
        expect(result.current.dimensions).toEqual([])
        expect(mockInitiateCallCount).toBe(0)
    })

    // ===== EXISTING TESTS =====

    it('isLoadingMore respects 300ms delay - does not show loading immediately', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Create real Redux store
        const store = setupStore(
            {
                dimensionSelection: dimensionSelectionSlice.reducer,
            },
            {
                dimensionSelection: {
                    dataSourceId: null,
                    searchTerm: '',
                    filter: 'DATA_ELEMENT',
                    dimensionCardCollapsedStates: {},
                    dimensionListLoadingStates: {},
                    multiSelectedDimensionIds: [],
                },
            }
        )

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Advance timers to complete initial fetch (mount effect + API delay)
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Verify initial state after first fetch
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(true)
        expect(result.current.dimensions).toEqual([mockApiDimension])

        // Setup API response for page 2 with SLOW response (600ms)
        // This ensures the fetch is still ongoing after the 300ms delay
        mockApiDelay = 600
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Trigger loadMore
        act(() => {
            result.current.loadMore()
        })

        // Immediately after loadMore, isLoadingMore should be false (delay is active)
        expect(result.current.isLoadingMore).toBe(false)

        // Advance 200ms (still within delay period)
        await act(() => vi.advanceTimersByTimeAsync(200))

        // isLoadingMore should still be false (delay still active)
        expect(result.current.isLoadingMore).toBe(false)

        // Advance another 150ms (total 350ms, past the 300ms delay)
        // At this point the fetch is still ongoing (600ms total), so isLoadingMore should be true
        await act(() => vi.advanceTimersByTimeAsync(150))

        // isLoadingMore should now be true (300ms delay expired, fetch still ongoing)
        expect(result.current.isLoadingMore).toBe(true)

        // Advance to complete the fetch (250ms more to reach 600ms total)
        await act(() => vi.advanceTimersByTimeAsync(250))

        // Fetch completed, but isLoadingMore should still be true due to trailing debounce
        expect(result.current.isLoadingMore).toBe(true)

        // Advance another 300ms to clear the trailing debounce
        await act(() => vi.advanceTimersByTimeAsync(300))

        // Now isLoadingMore should be false
        expect(result.current.isLoadingMore).toBe(false)

        // Verify dimensions were loaded
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    it('search triggers fetch when filter matches dimension type', async () => {
        // Setup API response
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Create real Redux store
        const store = setupStore(
            {
                dimensionSelection: dimensionSelectionSlice.reducer,
            },
            {
                dimensionSelection: {
                    dataSourceId: null,
                    searchTerm: '',
                    filter: 'DATA_ELEMENT',
                    dimensionCardCollapsedStates: {},
                    dimensionListLoadingStates: {},
                    multiSelectedDimensionIds: [],
                },
            }
        )

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Advance timers to complete initial fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Initial fetch should be complete
        expect(result.current.isLoading).toBe(false)

        const initialCallCount = mockInitiateCallCount

        // Update search term by dispatching to real Redux store
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Wait for search-triggered fetch (API delay)
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Verify a new fetch was triggered
        expect(mockInitiateCallCount).toBe(initialCallCount + 1)
        expect(lastInitiateQuery).not.toBeNull()
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:test'
        )
    })

    it('search does NOT trigger fetch when filter does NOT match dimension type', async () => {
        // Setup initial dimensions
        const fixedDimensions: DimensionMetadataItem[] = [
            {
                id: 'test-id-1',
                name: 'Test Dimension One',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            {
                id: 'test-id-2',
                name: 'Another Dimension',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
        ]

        // Create store with PROGRAM_INDICATOR filter (doesn't match DATA_ELEMENT in baseQuery)
        const store = createStoreWithPreloadedState({
            filter: 'PROGRAM_INDICATOR',
        })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            store
        )

        // No API call expected because filter doesn't match
        expect(mockInitiateCallCount).toBe(0)
        // Initial dimensions should be filtered client-side by filter (none match)
        expect(result.current.dimensions).toEqual([])

        // Update search term
        act(() => {
            store.dispatch(setSearchTerm('Test'))
        })

        // Still no API call (no need to advance timers - no fetch should happen)
        expect(mockInitiateCallCount).toBe(0)
        // Dimensions filtered client-side by search term (none match because filter already removed them)
        expect(result.current.dimensions).toEqual([])
    })

    it('loadMore function works and accumulates dimensions', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(result.current.hasMore).toBe(true)
        expect(result.current.dimensions).toEqual([mockApiDimension])

        // Setup API response for page 2 (hasMore false - last page)
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for API delay + sufficient time for debounce to settle
        // loadMore triggers fetch immediately (no 300ms delay like search does)
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay + 350))

        expect(mockInitiateCallCount).toBe(2)
        expect(lastInitiateQuery?.params?.page).toBe(2)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.isLoading).toBe(false)
        // Note: Not checking isLoadingMore here - behavior depends on exact timing
        // Dedicated tests below cover isLoadingMore timing scenarios
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    it('isLoadingMore remains false when fetch completes before 300ms delay', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // Setup API response for page 2 (fast response - 10ms, completes before 300ms delay)
        mockApiDelay = 10
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for fetch to complete (happens in ~10ms)
        await act(() => vi.advanceTimersByTimeAsync(10))

        // Dimensions should be accumulated
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])

        // isLoadingMore should never have been true (fetch completed before 300ms delay)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait for delay to expire (300ms)
        await act(() => vi.advanceTimersByTimeAsync(300))

        // isLoadingMore should still be false (fetch already completed)
        expect(result.current.isLoadingMore).toBe(false)
    })

    it('cleans up delay timer on component unmount', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result, unmount } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // Setup API response for page 2 with slow response
        mockApiDelay = 600
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Unmount immediately (during delay period)
        unmount()

        // Wait for delay period + extra time to ensure no state updates occur
        await act(() => vi.advanceTimersByTimeAsync(500))

        // No errors should occur from state updates after unmount
        // This test passes if no warnings/errors are thrown
    })

    it('isLoadingMore shows after 250ms and stays visible for minimum 400ms total', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // Setup API response for page 2 with SLOW response (500ms)
        // This ensures fetch completes AFTER the 250ms SHOW_DELAY
        // so loading UI will show at 250ms, then we test it stays visible for minimum 400ms total
        mockApiDelay = 500
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Immediately after loadMore, isLoadingMore should be false (SHOW_DELAY is active)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 249ms (just before SHOW_DELAY of 250ms)
        await act(() => vi.advanceTimersByTimeAsync(249))
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 1ms more (total 250ms, SHOW_DELAY expires)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 200ms (total 450ms, fetch still ongoing at 500ms)
        await act(() => vi.advanceTimersByTimeAsync(200))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 50ms (total 500ms, fetch completes)
        await act(() => vi.advanceTimersByTimeAsync(50))
        // Fetch completed, but loading started at 250ms, elapsed = 250ms
        // MIN_LOAD_DURATION = 400ms, so need to wait 150ms more

        // Wait 149ms (total 649ms, 149ms after fetch completed)
        await act(() => vi.advanceTimersByTimeAsync(149))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 1ms more (total 650ms, 150ms after fetch completed, total loading time = 400ms)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(false)

        // Verify dimensions were loaded
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    it('hasNoData is true when server returns empty result without search', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        expect(result.current.hasNoData).toBe(true)
        expect(result.current.dimensions).toEqual([])
    })

    it('hasNoData is false when server returns empty result with search', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({
                filter: 'DATA_ELEMENT',
                searchTerm: 'test',
            })
        )

        expect(result.current.hasNoData).toBe(false)
        expect(result.current.dimensions).toEqual([])
    })

    it('hasNoData is false when server returns data', async () => {
        // Setup API response with data
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        expect(result.current.hasNoData).toBe(false)
        expect(result.current.dimensions).toEqual([mockApiDimension])
    })

    it('hasNoData is false when there are fixed dimensions even if server returns empty', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({ id: 'fixed-1', name: 'Fixed Dimension 1' }),
            createDimension({ id: 'fixed-2', name: 'Fixed Dimension 2' }),
        ]

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // hasNoData should be false because we have fixed dimensions
        expect(result.current.hasNoData).toBe(false)
        expect(result.current.dimensions).toEqual(fixedDimensions)
    })

    it('hasNoData updates when search is cleared and server has no data', async () => {
        // Setup initial state with search that returns data
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({
            filter: 'DATA_ELEMENT',
            searchTerm: 'test',
        })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        expect(result.current.hasNoData).toBe(false)

        // Setup response for cleared search (no data)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        // Clear search term
        act(() => {
            store.dispatch(setSearchTerm(''))
        })

        // Wait for fetch to complete
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // hasNoData should update to true
        expect(result.current.hasNoData).toBe(true)
    })

    it('hasNoData is true only when no fixed dimensions AND no server data AND no search', async () => {
        // Test 1: No fixed dimensions, no server data, no search
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    // No fixed dimensions
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // Should be true: no fixed dims, no server data, no search
        expect(result.current.hasNoData).toBe(true)

        // Test 2: Add fixed dimensions (use different key to avoid state conflict)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({ id: 'fixed-1', name: 'Fixed Dimension 1' }),
        ]

        const { result: result2 } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-tracked-entity-type', // Different valid key
                    fixedDimensions, // Now has fixed dimensions
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        // Should be false: has fixed dimensions
        expect(result2.current.hasNoData).toBe(false)

        // Test 3: Add search term (use another different key)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result: result3 } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'event-without-registration', // Different valid key
                    // No fixed dimensions
                    baseQuery,
                }),
            createStoreWithPreloadedState({
                filter: 'DATA_ELEMENT',
                searchTerm: 'test', // Has search term
            })
        )

        // Should be false: has search term
        expect(result3.current.hasNoData).toBe(false)
    })

    it('hasNoData is sticky during search - retains value from before search', async () => {
        // Test 1: Start with no data, then search
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const store = createStoreWithPreloadedState({
            filter: 'DATA_ELEMENT',
            searchTerm: '', // No search initially
        })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Should be true: no search, no data, no fixed dims
        expect(result.current.hasNoData).toBe(true)

        // Setup search response (still no data)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // hasNoData should remain true (sticky during search)
        expect(result.current.hasNoData).toBe(true)

        // Test 2: Start with data, then search
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store2 = createStoreWithPreloadedState({
            filter: 'DATA_ELEMENT',
            searchTerm: '', // No search initially
        })

        const { result: result2 } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-tracked-entity-type', // Different key
                    baseQuery,
                }),
            store2
        )

        // Should be false: no search, has data
        expect(result2.current.hasNoData).toBe(false)

        // Setup search response (no data)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        // Apply search
        act(() => {
            store2.dispatch(setSearchTerm('test'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // hasNoData should remain false (sticky during search)
        expect(result2.current.hasNoData).toBe(false)
    })

    it('shows loading state during fetch and error state after failure', async () => {
        mockApiError = new Error('API Error')

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial state - loading should be true immediately
        expect(result.current.isLoading).toBe(true)
        expect(result.current.error).toBeUndefined()

        // Wait for error to be set after fetch fails
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Check error state after fetch resolves
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toHaveProperty('message', 'API Error')
        expect(result.current.error).toHaveProperty('type', 'runtime')
    })

    it('handles error during loadMore', async () => {
        // Setup page 1 successfully
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })
        )

        expect(result.current.dimensions).toEqual([mockApiDimension])
        expect(result.current.hasMore).toBe(true)
        expect(result.current.error).toBeUndefined()

        // Setup error for page 2
        mockApiResponse = null
        mockApiError = new Error('Page 2 Load Error')

        // Trigger loadMore
        act(() => {
            result.current.loadMore()
        })

        // Wait for error (fetch starts immediately for loadMore)
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Should set error but preserve page 1 data
        expect(result.current.error).toHaveProperty(
            'message',
            'Page 2 Load Error'
        )
        expect(result.current.error).toHaveProperty('type', 'runtime')
        expect(result.current.dimensions).toEqual([mockApiDimension])
    })

    it('recovers from error when search term changes', async () => {
        // Start with API error
        mockApiError = new Error('Initial API Error')

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Wait for error
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.error).toHaveProperty(
            'message',
            'Initial API Error'
        )
        expect(result.current.isLoading).toBe(false)

        // Clear error and setup successful response
        mockApiError = null
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Change search term
        act(() => {
            store.dispatch(setSearchTerm('new'))
        })

        // Wait for successful fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Error should be cleared and data loaded
        expect(result.current.error).toBeUndefined()
        expect(result.current.dimensions).toEqual([mockApiDimension])
        // Verify query contained search term
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:new'
        )
    })

    it('combines filtered fixedDimensions with fetched results during search', async () => {
        // Setup initial dimensions (client-side data)
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'initial-1',
                name: 'Test Initial Item',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'initial-2',
                name: 'Another Initial Item',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'initial-3',
                name: 'Different Item',
                dimensionType: 'DATA_ELEMENT',
            }),
        ]

        // Setup initial fetch response (page 1, no search)
        const fetchedDimension1 = createDimension({
            id: 'fetched-1',
            name: 'Fetched Dimension 1',
        })
        mockApiResponse = {
            dimensions: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            store
        )

        // Verify initial state: fixedDimensions + fetchedDimensions
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            fetchedDimension1,
        ])

        // Setup search response
        const searchFetchedDimension = createDimension({
            id: 'search-fetched-1',
            name: 'Test Search Result',
        })
        mockApiResponse = {
            dimensions: [searchFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Apply search for "Test"
        act(() => {
            store.dispatch(setSearchTerm('Test'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Verify search results combine:
        // 1. Client-side filtered fixedDimensions (only "Test Initial Item" matches)
        // 2. Server-side filtered fetched results
        expect(result.current.dimensions).toEqual([
            fixedDimensions[0], // "Test Initial Item" matches "Test"
            searchFetchedDimension, // "Test Search Result" from API
        ])

        // Verify API was called with search filter
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:Test'
        )
    })

    it('filters combined fixedDimensions and fetched results by dimensionType', async () => {
        // Setup initial dimensions with mixed dimension types
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'initial-de-1',
                name: 'Initial Data Element',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'initial-pi-1',
                name: 'Initial Program Indicator',
                dimensionType: 'PROGRAM_INDICATOR',
                valueType: 'NUMBER',
            }),
            createDimension({
                id: 'initial-de-2',
                name: 'Another Data Element',
                dimensionType: 'DATA_ELEMENT',
            }),
        ]

        // Setup fetched dimensions (DATA_ELEMENT type from baseQuery)
        const fetchedDimension1 = createDimension({
            id: 'fetched-de-1',
            name: 'Fetched Data Element',
            dimensionType: 'DATA_ELEMENT',
        })
        mockApiResponse = {
            dimensions: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: null })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            store
        )

        // Verify initial state with no filter: all fixedDimensions + fetchedDimensions
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            fetchedDimension1,
        ])

        // Apply DATA_ELEMENT filter
        act(() => {
            store.dispatch(setFilter('DATA_ELEMENT'))
        })

        // Only DATA_ELEMENT items should be shown (both fixed and fetched)
        expect(result.current.dimensions).toEqual([
            fixedDimensions[0],
            fixedDimensions[2],
            fetchedDimension1,
        ])

        // Apply PROGRAM_INDICATOR filter
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // Only PROGRAM_INDICATOR items should be shown
        // No new fetch happens because filter doesn't match baseQuery
        expect(result.current.dimensions).toEqual([fixedDimensions[1]])

        // Apply filter that matches no items
        act(() => {
            store.dispatch(setFilter('CATEGORY'))
        })

        // No dimensions match CATEGORY filter
        expect(result.current.dimensions).toEqual([])

        // Remove filter (set to null)
        act(() => {
            store.dispatch(clearFilter())
        })

        // Should show all items again
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            fetchedDimension1,
        ])
    })

    it('clears search term and refetches original data', async () => {
        // Setup initial fetch
        const initialFetchedDimension = createDimension({
            id: 'initial-fetched',
            name: 'Initial Fetched',
        })
        mockApiResponse = {
            dimensions: [initialFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        expect(result.current.dimensions).toEqual([initialFetchedDimension])

        // Setup search response
        const searchDimension = createDimension({
            id: 'search-result',
            name: 'Search Result',
        })
        mockApiResponse = {
            dimensions: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('search'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([searchDimension])

        // Setup response for cleared search (back to original)
        const clearedSearchDimension = createDimension({
            id: 'cleared-search',
            name: 'Cleared Search Result',
        })
        mockApiResponse = {
            dimensions: [clearedSearchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Clear search term (set to empty string)
        act(() => {
            store.dispatch(setSearchTerm(''))
        })

        // Wait for refetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Verify refetch occurred with cleared search
        expect(result.current.dimensions).toEqual([clearedSearchDimension])
        expect(lastInitiateQuery?.params?.filter).not.toContain(
            'displayName:ilike:'
        )
    })

    it('works without baseQuery using only fixedDimensions', async () => {
        const fixedDimensions: DimensionMetadataItem[] = [
            {
                id: 'initial-1',
                name: 'Initial Item 1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            {
                id: 'initial-2',
                name: 'Initial Item 2',
                dimensionType: 'PROGRAM_INDICATOR',
                valueType: 'NUMBER',
            },
        ]

        const store = createStoreWithPreloadedState()

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    // No baseQuery provided
                }),
            store
        )

        // Should show all fixedDimensions, no fetch should occur
        expect(result.current.dimensions).toEqual(fixedDimensions)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(false)
        expect(mockInitiateCallCount).toBe(0)

        // Apply filter - should filter client-side only
        act(() => {
            store.dispatch(setFilter('DATA_ELEMENT'))
        })

        expect(result.current.dimensions).toEqual([fixedDimensions[0]])
        expect(mockInitiateCallCount).toBe(0)

        // Apply search - should filter client-side only
        act(() => {
            store.dispatch(setSearchTerm('Item 2'))
        })

        // No fetch should occur (no baseQuery)
        expect(mockInitiateCallCount).toBe(0)
        // But should filter by search term
        expect(result.current.dimensions).toEqual([])

        // Clear filter to see search-filtered results
        act(() => {
            store.dispatch(clearFilter())
        })

        expect(result.current.dimensions).toEqual([fixedDimensions[1]])
    })

    it('handles loadMore followed by filter change', async () => {
        // Setup page 1 with hasMore
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial fetch is complete
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(true)

        // Setup page 2
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

        // Load more (page 2)
        act(() => {
            result.current.loadMore()
        })

        // Wait for loadMore fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.isLoading).toBe(false)
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])

        expect(mockInitiateCallCount).toBe(2)
        const callCountAfterLoadMore = mockInitiateCallCount

        // Change filter to non-matching
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // DATA_ELEMENT dimensions should be filtered out by PROGRAM_INDICATOR filter
        expect(mockInitiateCallCount).toBe(callCountAfterLoadMore)
        expect(result.current.dimensions).toEqual([])
        expect(result.current.hasMore).toBe(false)
    })

    it('handles loadMore followed by search term change', async () => {
        // Setup page 1
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial fetch is complete
        expect(result.current.isLoading).toBe(false)
        expect(result.current.dimensions).toEqual([mockApiDimension])

        // Setup page 2
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for loadMore fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])

        // Setup new search results (page 1)
        const searchDimension = {
            ...mockApiDimension,
            id: 'search-id',
            name: 'Search Result',
        }
        mockApiResponse = {
            dimensions: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Change search term - should reset to page 1 and clear previous data
        act(() => {
            store.dispatch(setSearchTerm('search'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        // Verify data was reset and only search results are shown
        expect(result.current.dimensions).toEqual([searchDimension])
        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:search'
        )
    })

    it('handles search followed by loadMore', async () => {
        // Setup initial fetch response (no search)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial fetch is complete
        expect(result.current.isLoading).toBe(false)

        // Setup page 1 of search results
        const searchDimension1 = {
            ...mockApiDimension,
            id: 'search-id-1',
            name: 'Search Result 1',
        }
        mockApiResponse = {
            dimensions: [searchDimension1],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([searchDimension1])

        // Verify search filter was applied
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:test'
        )
        expect(result.current.hasMore).toBe(true)

        // Setup page 2 of search results with SLOW response
        mockApiDelay = 600 // Slow response to ensure loading state is visible
        const searchDimension2 = {
            ...mockApiDimension,
            id: 'search-id-2',
            name: 'Search Result 2',
        }
        mockApiResponse = {
            dimensions: [searchDimension2],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait 249ms (just before SHOW_DELAY of 250ms)
        await act(() => vi.advanceTimersByTimeAsync(249))
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 1ms more (total 250ms, SHOW_DELAY expires)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait for loadMore to complete (API delay - 600ms total from start)
        // At 600ms: fetch completes, loading started at 250ms, elapsed = 350ms
        // MIN_LOAD_DURATION = 400ms, so need to wait 50ms more
        await act(() => vi.advanceTimersByTimeAsync(350)) // Total 600ms from start

        // Still loading (needs to complete MIN_LOAD_DURATION of 400ms total)
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 49ms (total 649ms, 49ms after fetch completed)
        await act(() => vi.advanceTimersByTimeAsync(49))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 1ms more (total 650ms, 50ms after fetch completed, total loading time = 400ms)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(false)

        // Verify both pages have search filter and data accumulates
        expect(result.current.dimensions).toEqual([
            searchDimension1,
            searchDimension2,
        ])
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:test'
        )
        expect(lastInitiateQuery?.params?.page).toBe(2)

        // Reset mockApiDelay for next test
        mockApiDelay = 10
    })

    it('handles filter change followed by search', async () => {
        // Initial dimensions (client-side only, no API fetch since filter doesn't match)
        const fixedDimensions: DimensionMetadataItem[] = [
            {
                id: 'initial-1',
                name: 'Initial Data Element',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
        ]

        const store = createStoreWithPreloadedState({
            filter: 'PROGRAM_INDICATOR', // doesn't match DATA_ELEMENT
        })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery, // baseQuery has DATA_ELEMENT filter
                }),
            store
        )

        // No API call expected (filter doesn't match baseQuery)
        expect(mockInitiateCallCount).toBe(0)
        // fixedDimensions filtered out by filter (none match PROGRAM_INDICATOR)
        expect(result.current.dimensions).toEqual([])

        const callCountAfterFilterChange = mockInitiateCallCount

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Still no API call (filter still doesn't match)
        expect(mockInitiateCallCount).toBe(callCountAfterFilterChange)
        // Client-side search on empty filtered list
        expect(result.current.dimensions).toEqual([])
    })

    it('handles multiple sequential loadMore calls', async () => {
        // Setup page 1
        const dimension1 = { ...mockApiDimension, id: 'id-1', name: 'Dim 1' }
        mockApiResponse = {
            dimensions: [dimension1],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Wait for page 1
        expect(result.current.isLoading).toBe(false)
        expect(result.current.dimensions).toEqual([dimension1])

        expect(allInitiateQueries[0]?.params?.page).toBe(1)

        // Setup page 2
        const dimension2 = { ...mockApiDimension, id: 'id-2', name: 'Dim 2' }
        mockApiResponse = {
            dimensions: [dimension2],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

        // Load more (page 2)
        act(() => {
            result.current.loadMore()
        })

        // Wait for loadMore fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([dimension1, dimension2])

        expect(allInitiateQueries[1]?.params?.page).toBe(2)

        // Setup page 3
        const dimension3 = { ...mockApiDimension, id: 'id-3', name: 'Dim 3' }
        mockApiResponse = {
            dimensions: [dimension3],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        }

        // Load more (page 3)
        act(() => {
            result.current.loadMore()
        })

        // Wait for loadMore fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([
            dimension1,
            dimension2,
            dimension3,
        ])

        expect(allInitiateQueries[2]?.params?.page).toBe(3)
        expect(result.current.hasMore).toBe(false)
    })

    it('resets pagination when search changes after loadMore', async () => {
        // Setup initial fetch response (no search)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial fetch is complete
        expect(result.current.isLoading).toBe(false)

        // Setup page 1 for first search
        const firstSearch1 = {
            ...mockApiDimension,
            id: 'first-1',
            name: 'First Search 1',
        }
        mockApiResponse = {
            dimensions: [firstSearch1],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Apply first search
        act(() => {
            store.dispatch(setSearchTerm('first'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([firstSearch1])

        // Setup page 2 of first search with SLOW response
        mockApiDelay = 600 // Slow response to ensure loading state is visible
        const firstSearch2 = {
            ...mockApiDimension,
            id: 'first-2',
            name: 'First Search 2',
        }
        mockApiResponse = {
            dimensions: [firstSearch2],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait 249ms (just before SHOW_DELAY of 250ms)
        await act(() => vi.advanceTimersByTimeAsync(249))
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 1ms more (total 250ms, SHOW_DELAY expires)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait for loadMore to complete (API delay - 600ms total from start)
        // At 600ms: fetch completes, loading started at 250ms, elapsed = 350ms
        // MIN_LOAD_DURATION = 400ms, so need to wait 50ms more
        await act(() => vi.advanceTimersByTimeAsync(350)) // Total 600ms from start

        // Still loading (needs to complete MIN_LOAD_DURATION of 400ms total)
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 49ms (total 649ms, 49ms after fetch completed)
        await act(() => vi.advanceTimersByTimeAsync(49))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 1ms more (total 650ms, 50ms after fetch completed, total loading time = 400ms)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoadingMore).toBe(false)

        expect(result.current.dimensions).toEqual([firstSearch1, firstSearch2])

        // Setup page 1 for second search
        const secondSearch1 = {
            ...mockApiDimension,
            id: 'second-1',
            name: 'Second Search 1',
        }
        mockApiResponse = {
            dimensions: [secondSearch1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Change search term - should clear previous data and start from page 1
        act(() => {
            store.dispatch(setSearchTerm('second'))
        })

        // Wait for search fetch
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([secondSearch1])

        // Verify pagination reset and data cleared
        expect(result.current.dimensions).toEqual([secondSearch1])
        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:second'
        )

        // Reset mockApiDelay for next test
        mockApiDelay = 10
    })

    it('tracks isLoading and isLoadingMore states correctly', async () => {
        // Setup page 1
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Initial state
        expect(result.current.isLoading).toBe(true)
        expect(result.current.isLoadingMore).toBe(false)

        // Stage 1: After initial data loads
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.isLoading).toBe(false)
        expect(result.current.isLoadingMore).toBe(false)
        expect(result.current.dimensions).toEqual([mockApiDimension])

        // Stage 2: load more with SLOW response
        mockApiDelay = 600 // Slow response to ensure loading state is visible
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        act(() => {
            result.current.loadMore()
        })

        // Wait 249ms (just before SHOW_DELAY of 250ms)
        await act(() => vi.advanceTimersByTimeAsync(249))
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 1ms more (total 250ms, SHOW_DELAY expires)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isLoadingMore).toBe(true)

        // Wait for API to complete (600ms total from start)
        // At 600ms: fetch completes, loading started at 250ms, elapsed = 350ms
        // MIN_LOAD_DURATION = 400ms, so need to wait 50ms more
        await act(() => vi.advanceTimersByTimeAsync(350)) // Total 600ms from start

        // Still loading (needs to complete MIN_LOAD_DURATION of 400ms total)
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 49ms (total 649ms, 49ms after fetch completed)
        await act(() => vi.advanceTimersByTimeAsync(49))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait 1ms more (total 650ms, 50ms after fetch completed, total loading time = 400ms)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isLoadingMore).toBe(false)
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])

        // Stage 3: Trigger search (should not show isLoading or isLoadingMore)
        const searchDimension = {
            ...mockApiDimension,
            id: 'search-id',
            name: 'Search Result',
        }
        mockApiResponse = {
            dimensions: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Wait for search to complete
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.isLoading).toBe(false)
        expect(result.current.isLoadingMore).toBe(false)
        expect(result.current.dimensions).toEqual([searchDimension])

        // Reset mockApiDelay for next test
        mockApiDelay = 10
    })

    it('shows stale data while fetching new search results (stale-while-revalidate)', async () => {
        // Setup fixed dimensions
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'fixed-1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'fixed-2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'fixed-3',
                name: 'Apricot',
                dimensionType: 'DATA_ELEMENT',
            }),
        ]

        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT'],
            },
        }

        // Initial API response (empty search)
        const initialFetchedDimension = createDimension({
            id: 'fetched-1',
            name: 'Initial Fetched',
            dimensionType: 'DATA_ELEMENT',
        })
        mockApiResponse = {
            dimensions: [initialFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            store
        )

        // Verify initial state: all fixed dimensions + fetched dimension
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            initialFetchedDimension,
        ])

        // Setup search API response (search for "Apple")
        const searchFetchedDimension = createDimension({
            id: 'search-fetched-1',
            name: 'Apple Pie',
            dimensionType: 'DATA_ELEMENT',
        })
        mockApiResponse = {
            dimensions: [searchFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Clear previous call count to track new fetch
        const initialCallCount = mockInitiateCallCount

        // Update search term to "Apple"
        act(() => {
            store.dispatch(setSearchTerm('Apple'))
        })

        // During fetch, dimensions should still show stale data (previous resolvedSearchTerm)
        // Fixed dimensions filtered with empty search term (all), plus previous fetched dimensions
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            initialFetchedDimension,
        ])

        // Wait for search results to update
        await act(() => vi.advanceTimersByTimeAsync(mockApiDelay))

        expect(result.current.dimensions).toEqual([
            fixedDimensions[0], // Apple
            searchFetchedDimension,
        ])

        // Verify API was called with search filter
        expect(mockInitiateCallCount).toBe(initialCallCount + 1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:Apple'
        )
    })

    it('immediately filters fixed dimensions when fetch disabled (filter mismatch)', async () => {
        // Setup fixed dimensions
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'fixed-1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: 'fixed-2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
        ]

        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT'],
            },
        }

        // No API response needed because filter mismatch disables fetch
        mockApiResponse = null

        const store = createStoreWithPreloadedState({
            filter: 'PROGRAM_INDICATOR', // does not match DATA_ELEMENT
        })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            store
        )

        // No fetch should occur
        expect(mockInitiateCallCount).toBe(0)
        // Fixed dimensions filtered by filter (none match PROGRAM_INDICATOR)
        expect(result.current.dimensions).toEqual([])

        // Update search term to "Apple"
        act(() => {
            store.dispatch(setSearchTerm('Apple'))
        })

        // Still no fetch (filter still mismatched)
        expect(mockInitiateCallCount).toBe(0)
        // Fixed dimensions should be filtered immediately with new search term
        // Only Apple matches, but filter still PROGRAM_INDICATOR, so none match
        expect(result.current.dimensions).toEqual([])
    })

    it('cleans up loading state on unmount', async () => {
        const removeLoadingStateSpy = vi.spyOn(
            dimensionSelectionActions,
            'removeDimensionListLoadingState'
        )

        // Set up mock response to allow the fetch to complete
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { unmount, result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        // Fetch is complete
        expect(result.current.isLoading).toBe(false)

        // Unmount hook
        unmount()

        // Verify cleanup action was called
        expect(removeLoadingStateSpy).toHaveBeenCalledWith('program-indicators')
    })

    it('isDisabledByFilter recomputes when filter changes', async () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({ id: 'dim-1', dimensionType: 'DATA_ELEMENT' }),
            createDimension({
                id: 'dim-2',
                dimensionType: 'PROGRAM_INDICATOR',
            }),
        ]

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                    fixedDimensions,
                }),
            store
        )

        // Initially enabled (DATA_ELEMENT matches baseQuery)
        expect(result.current.isDisabledByFilter).toBe(false)

        // Change to PROGRAM_INDICATOR (doesn't match baseQuery but matches fixedDimensions)
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        expect(result.current.isDisabledByFilter).toBe(false)

        // Change to CATEGORY (doesn't match baseQuery or fixedDimensions)
        act(() => {
            store.dispatch(setFilter('CATEGORY'))
        })

        expect(result.current.isDisabledByFilter).toBe(true)
    })

    it('filters fetched dimensions by UI filter when filter changes (regression test for fix)', async () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT'],
            },
        }

        // Setup API response with DATA_ELEMENT dimensions
        const fetchedDataElement1 = createDimension({
            id: 'fetched-de-1',
            name: 'Fetched Data Element 1',
            dimensionType: 'DATA_ELEMENT',
        })
        const fetchedDataElement2 = createDimension({
            id: 'fetched-de-2',
            name: 'Fetched Data Element 2',
            dimensionType: 'DATA_ELEMENT',
        })

        mockApiResponse = {
            dimensions: [fetchedDataElement1, fetchedDataElement2],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 2 },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            store
        )

        expect(result.current.dimensions).toEqual([
            fetchedDataElement1,
            fetchedDataElement2,
        ])

        // Change filter to PROGRAM_INDICATOR
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // DATA_ELEMENT dimensions should be filtered out
        expect(result.current.dimensions).toEqual([])

        // Change filter back to DATA_ELEMENT
        act(() => {
            store.dispatch(setFilter('DATA_ELEMENT'))
        })

        expect(result.current.dimensions).toEqual([
            fetchedDataElement1,
            fetchedDataElement2,
        ])

        // Clear filter
        act(() => {
            store.dispatch(clearFilter())
        })

        // All dimensions should be shown with no filter
        expect(result.current.dimensions).toEqual([
            fetchedDataElement1,
            fetchedDataElement2,
        ])
    })

    it('works without dimensionListKey (for cards without async data)', async () => {
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'fixed-1',
                name: 'Fixed Dimension 1',
                dimensionType: 'ORGANISATION_UNIT',
            }),
            createDimension({
                id: 'fixed-2',
                name: 'Fixed Dimension 2',
                dimensionType: 'PERIOD',
            }),
        ]

        const store = createStoreWithPreloadedState()

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
                    fixedDimensions,
                }),
            store
        )

        // Should return fixed dimensions without any API calls
        expect(result.current.dimensions).toEqual(fixedDimensions)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeUndefined()
        expect(result.current.hasMore).toBe(false)
        expect(mockInitiateCallCount).toBe(0)
    })

    it('does not fetch when dimensionListKey is undefined even with baseQuery', async () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT'],
            },
        }

        const store = createStoreWithPreloadedState({ filter: 'DATA_ELEMENT' })

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
                    baseQuery,
                }),
            store
        )

        // Should not fetch even though filter matches baseQuery
        expect(result.current.dimensions).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(mockInitiateCallCount).toBe(0)
    })

    it('filters fixed dimensions when dimensionListKey is undefined', async () => {
        const fixedDimensions: DimensionMetadataItem[] = [
            createDimension({
                id: 'fixed-1',
                name: 'Fixed Dimension 1',
                dimensionType: 'ORGANISATION_UNIT',
            }),
            createDimension({
                id: 'fixed-2',
                name: 'Fixed Dimension 2',
                dimensionType: 'PERIOD',
            }),
            createDimension({
                id: 'fixed-3',
                name: 'Another Fixed Dimension',
                dimensionType: 'ORGANISATION_UNIT',
            }),
        ]

        const store = createStoreWithPreloadedState()

        const { result } = renderHookWithReduxStoreProvider(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
                    fixedDimensions,
                }),
            store
        )

        // Initially all fixed dimensions should be shown
        expect(result.current.dimensions).toEqual(fixedDimensions)

        // Apply ORGANISATION_UNIT filter
        act(() => {
            store.dispatch(setFilter('ORGANISATION_UNIT'))
        })

        // Only ORGANISATION_UNIT dimensions should be shown
        expect(result.current.dimensions).toEqual([
            createDimension({
                id: 'fixed-1',
                name: 'Fixed Dimension 1',
                dimensionType: 'ORGANISATION_UNIT',
            }),
            createDimension({
                id: 'fixed-3',
                name: 'Another Fixed Dimension',
                dimensionType: 'ORGANISATION_UNIT',
            }),
        ])

        // Apply search term
        act(() => {
            store.dispatch(setSearchTerm('Another'))
        })

        // Only matching dimension should be shown
        expect(result.current.dimensions).toEqual([
            createDimension({
                id: 'fixed-3',
                name: 'Another Fixed Dimension',
                dimensionType: 'ORGANISATION_UNIT',
            }),
        ])
    })

    it('accepts custom transformer', async () => {
        const customTransformer: Transformer = vi.fn((data) => {
            // Simulate a different response structure (non-paginated example)
            const response = data as {
                trackedEntityTypeAttributes: Array<{
                    trackedEntityAttribute: {
                        id: string
                        name: string
                        valueType: string
                    }
                }>
            }
            const dimensions = response.trackedEntityTypeAttributes.map(
                (item) => ({
                    id: item.trackedEntityAttribute.id,
                    name: item.trackedEntityAttribute.name,
                    dimensionType: 'DATA_ELEMENT' as const,
                    valueType: item.trackedEntityAttribute.valueType as 'TEXT',
                    dimensionItemType: 'DATA_ELEMENT' as const,
                })
            )
            // No pager in this response, so nextPage is null
            return { dimensions, nextPage: null }
        })

        mockApiResponse = {
            trackedEntityTypeAttributes: [
                {
                    trackedEntityAttribute: {
                        id: 'attr-1',
                        name: 'Attribute 1',
                        valueType: 'TEXT',
                    },
                },
                {
                    trackedEntityAttribute: {
                        id: 'attr-2',
                        name: 'Attribute 2',
                        valueType: 'NUMBER',
                    },
                },
            ],
        }

        const store = createStoreWithPreloadedState()

        const { result } = await renderHookAndWaitForInitialLoad(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery: {
                        resource: 'trackedEntityTypes',
                    } as SingleQuery,
                    transformer: customTransformer,
                }),
            store
        )

        expect(customTransformer).toHaveBeenCalledWith(mockApiResponse)
        expect(result.current.dimensions).toHaveLength(2)
        expect(result.current.dimensions[0].id).toBe('attr-1')
        expect(result.current.dimensions[0].name).toBe('Attribute 1')
        expect(result.current.hasMore).toBe(false) // No pager in response
    })
})
