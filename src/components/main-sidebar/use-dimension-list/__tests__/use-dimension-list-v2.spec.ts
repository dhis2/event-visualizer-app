import { act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    useDimensionList,
    defaultTransformer,
    getFilterParamsFromBaseQuery,
    buildQuery,
    isFetchEnabledByFilter,
    filterDimensions,
    computeIsDisabledByFilter,
} from '..'
import {
    dimensionSelectionSlice,
    setSearchTerm,
    setFilter,
    clearFilter,
} from '@store/dimensions-selection-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import type { DimensionMetadataItem, SingleQuery, DimensionType } from '@types'

// ===== MOCK SETUP =====
let mockApiResponse: unknown = null
let mockApiError: Error | null = null
let mockApiDelay = 10 // Default delay in ms
let mockInitiateCallCount = 0
let lastInitiateQuery: SingleQuery | null = null

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

// ===== UTILITY FUNCTION TESTS (NO FAKE TIMERS NEEDED) =====

describe('defaultTransformer', () => {
    it('transforms API response correctly', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.dimensions[0].id).toBe('api-id-1')
        expect(result.nextPage).toBe(2)
    })

    it('returns null nextPage on last page', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.nextPage).toBe(null)
    })

    it('throws on invalid response', () => {
        expect(() => defaultTransformer({})).toThrow('Invalid response data')
    })

    it('handles empty dimensions array', () => {
        const mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.dimensions).toEqual([])
        expect(result.nextPage).toBe(null)
    })

    it('throws when pager is missing', () => {
        const mockApiResponse = {
            dimensions: [],
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid response data'
        )
    })

    it('throws when pager properties are invalid', () => {
        const mockApiResponse = {
            dimensions: [],
            pager: { page: 'invalid', pageCount: 1, pageSize: 50, total: 0 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid pager structure'
        )
    })

    it('throws when dimensions is not an array', () => {
        const mockApiResponse = {
            dimensions: 'not an array',
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Dimensions is not an array'
        )
    })

    it('throws when dimension items are invalid', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    // missing dimensionType, dimensionItemType, valueType
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid dimension metadata items'
        )
    })
})

describe('getFilterParamsFromBaseQuery', () => {
    it('returns empty array for undefined baseQuery', () => {
        const result = getFilterParamsFromBaseQuery(undefined)
        expect(result).toEqual([])
    })

    it('returns empty array for baseQuery without params', () => {
        const baseQuery = { resource: 'dimensions' } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('returns empty array for baseQuery without filter param', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { page: 1 },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('handles filter as empty string', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: '' },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('splits comma-separated string filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: {
                filter: 'dimensionType:eq:DATA_ELEMENT,dimensionItemType:eq:INDICATOR',
            },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'dimensionItemType:eq:INDICATOR',
        ])
    })

    it('copies array filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'dimensionItemType:eq:INDICATOR',
                ],
            },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'dimensionItemType:eq:INDICATOR',
        ])
        // Ensure it's a copy, not the same reference
        expect(result).not.toBe(baseQuery.params!.filter)
    })

    it('throws on invalid filter format', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 123 },
        } as unknown as SingleQuery
        expect(() => getFilterParamsFromBaseQuery(baseQuery)).toThrow(
            'Invalid filter query params'
        )
    })

    it('throws on array with non-string items', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: ['valid', 123] },
        } as unknown as SingleQuery
        expect(() => getFilterParamsFromBaseQuery(baseQuery)).toThrow(
            'Invalid filter query params'
        )
    })
})

describe('buildQuery', () => {
    const baseQuery: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }

    it('builds query with page number', () => {
        const result = buildQuery(baseQuery, '', 1)
        expect(result.params.page).toBe(1)
        expect(result.resource).toBe('dimensions')
        expect(result.params.filter).toEqual(['dimensionType:eq:DATA_ELEMENT'])
    })

    it('adds search term to filter', () => {
        const result = buildQuery(baseQuery, 'test', 1)
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'displayName:ilike:test',
        ])
    })

    it('preserves existing filters when adding search term', () => {
        const baseQueryWithMultipleFilters: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT', 'valueType:eq:TEXT'],
            },
        }
        const result = buildQuery(baseQueryWithMultipleFilters, 'search', 2)
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'valueType:eq:TEXT',
            'displayName:ilike:search',
        ])
    })

    it('handles query without params', () => {
        const baseQueryWithoutParams: SingleQuery = {
            resource: 'dimensions',
        }
        const result = buildQuery(baseQueryWithoutParams, '', 1)
        expect(result.params.page).toBe(1)
        expect(result.params.filter).toEqual([])
    })

    it('does not mutate input baseQuery', () => {
        const filter = baseQuery.params?.filter
        if (!filter) {
            throw new Error('Expected filter to be defined')
        }
        const originalFilter = Array.isArray(filter) ? [...filter] : [filter]
        const result = buildQuery(baseQuery, 'test', 1)
        // Original should remain unchanged
        expect(baseQuery.params?.filter).toEqual(originalFilter)
        // Result should have added search term
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'displayName:ilike:test',
        ])
    })

    it('handles empty search term', () => {
        const result = buildQuery(baseQuery, '', 1)
        expect(result.params.filter).toEqual(['dimensionType:eq:DATA_ELEMENT'])
    })
})

describe('isFetchEnabledByFilter', () => {
    const baseQueryWithDimensionType: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }

    const baseQueryWithoutDimensionType: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['displayName:ilike:test'],
        },
    }

    const baseQueryWithoutFilter: SingleQuery = {
        resource: 'dimensions',
    }

    it('returns true when filter is null', () => {
        const result = isFetchEnabledByFilter(baseQueryWithDimensionType, null)
        expect(result).toBe(true)
    })

    it('returns true when filter matches dimension type in query', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithDimensionType,
            'DATA_ELEMENT'
        )
        expect(result).toBe(true)
    })

    it('returns false when filter does not match dimension type in query', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithDimensionType,
            'PROGRAM_INDICATOR'
        )
        expect(result).toBe(false)
    })

    it('returns true when query has no dimension type filter', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutDimensionType,
            'PROGRAM_INDICATOR'
        )
        expect(result).toBe(true)
    })

    it('returns true when query has no dimension type filter and filter is null', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutDimensionType,
            null
        )
        expect(result).toBe(true)
    })

    it('returns true when baseQuery has no params', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutFilter,
            'DATA_ELEMENT'
        )
        expect(result).toBe(true)
    })

    it('returns true when baseQuery has params but no filter', () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {},
        }
        const result = isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })

    it('handles dimension type filter with extra characters', () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'displayName:ilike:test',
                ],
            },
        }
        const result = isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })
})

describe('filterDimensions', () => {
    const dimensions = [
        createDimension({
            id: '1',
            name: 'Apple',
            dimensionType: 'DATA_ELEMENT',
        }),
        createDimension({
            id: '2',
            name: 'Banana',
            dimensionType: 'DATA_ELEMENT',
        }),
        createDimension({
            id: '3',
            name: 'Cherry',
            dimensionType: 'PROGRAM_INDICATOR',
        }),
        createDimension({
            id: '4',
            name: 'Apricot',
            dimensionType: 'PROGRAM_INDICATOR',
        }),
    ]

    it('returns all dimensions when no search term and no filter', () => {
        const result = filterDimensions(dimensions, '', null)
        expect(result).toEqual(dimensions)
    })

    it('filters by search term (case-insensitive)', () => {
        const result = filterDimensions(dimensions, 'ap', null)
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '4',
                name: 'Apricot',
                dimensionType: 'PROGRAM_INDICATOR',
            }),
        ])
    })

    it('filters by dimension type', () => {
        const result = filterDimensions(dimensions, '', 'DATA_ELEMENT')
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
        ])
    })

    it('filters by both search term and dimension type (AND logic)', () => {
        const result = filterDimensions(dimensions, 'a', 'DATA_ELEMENT')
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
        ])
    })

    it('returns empty array when no matches', () => {
        const result = filterDimensions(dimensions, 'xyz', 'DATA_ELEMENT')
        expect(result).toEqual([])
    })

    it('handles empty dimensions array', () => {
        const result = filterDimensions([], 'test', 'DATA_ELEMENT')
        expect(result).toEqual([])
    })

    it('returns empty array when filter matches no dimensions', () => {
        const result = filterDimensions(dimensions, '', 'STATUS')
        expect(result).toEqual([])
    })

    it('preserves order of filtered dimensions', () => {
        const result = filterDimensions(dimensions, '', 'DATA_ELEMENT')
        expect(result.map((d) => d.id)).toEqual(['1', '2'])
    })
})

describe('computeIsDisabledByFilter', () => {
    it('returns false when filter matches baseQuery dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(false)
    })

    it('returns true when filter does not match baseQuery dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, 'PROGRAM_INDICATOR')
        expect(result).toBe(true)
    })

    it('returns false when filter is null', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, null)
        expect(result).toBe(false)
    })

    it('returns false when fixedDimensionTypes contains matching dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const fixedDimensionTypes: DimensionType[] = [
            'PROGRAM_INDICATOR',
            'DATA_ELEMENT',
        ]
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            fixedDimensionTypes
        )
        expect(result).toBe(false)
    })

    it('returns true when filter does not match baseQuery or any fixedDimensionTypes', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const fixedDimensionTypes: DimensionType[] = [
            'DATA_ELEMENT',
            'DATA_ELEMENT',
        ]
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            fixedDimensionTypes
        )
        expect(result).toBe(true)
    })

    it('returns true when fixedDimensionTypes is empty and filter does not match baseQuery', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            []
        )
        expect(result).toBe(true)
    })

    it('returns true when no baseQuery and no fixedDimensionTypes provided', () => {
        const result = computeIsDisabledByFilter(undefined, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })

    it('returns false when no baseQuery but fixedDimensionTypes match filter', () => {
        const fixedDimensionTypes: DimensionType[] = ['DATA_ELEMENT']
        const result = computeIsDisabledByFilter(
            undefined,
            'DATA_ELEMENT',
            fixedDimensionTypes
        )
        expect(result).toBe(false)
    })

    it('handles baseQuery without dimension type filter', () => {
        const baseQueryWithoutDimensionType: SingleQuery = {
            resource: 'programIndicators',
            params: {
                filter: ['program.id:eq:abc123'],
            },
        }
        const result = computeIsDisabledByFilter(
            baseQueryWithoutDimensionType,
            'DATA_ELEMENT'
        )
        expect(result).toBe(false)
    })

    it('returns false when no baseQuery and filter is null (fixed-only list with no filter)', () => {
        const result = computeIsDisabledByFilter(undefined, null)
        expect(result).toBe(false)
    })

    it('returns true when no baseQuery and filter does not match fixedDimensionTypes', () => {
        const fixedDimensionTypes: DimensionType[] = [
            'DATA_ELEMENT',
            'PROGRAM_INDICATOR',
        ]
        const result = computeIsDisabledByFilter(
            undefined,
            'CATEGORY',
            fixedDimensionTypes
        )
        expect(result).toBe(true)
    })
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
                    dimensionCardCollapseStates: {},
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
                    dimensionCardCollapseStates: {},
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
                    dimensionCardCollapseStates: {},
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

    it('isLoadingMore delays hiding loading UI for 300ms after fetch completes', async () => {
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
        // This ensures fetch completes AFTER the 300ms debounce delay
        // so loading UI will show, then we test it stays visible for 300ms after fetch completes
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

        // Immediately after loadMore, isLoadingMore should be false (delay is active)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 350ms (just past the 300ms delay, fetch still ongoing at 500ms)
        await act(() => vi.advanceTimersByTimeAsync(350))

        // isLoadingMore should now be true (300ms delay expired, fetch still ongoing)
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 200ms (total 550ms, fetch completed at 500ms)
        // At 550ms: fetch completed 50ms ago, but loading UI should still be visible
        // because debounce delays hiding for 300ms after isFetching becomes false
        await act(() => vi.advanceTimersByTimeAsync(200))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 100ms (total 650ms, 150ms after fetch completed)
        // Loading UI should still be visible (total 250ms since fetch completed, < 300ms)
        await act(() => vi.advanceTimersByTimeAsync(100))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 100ms (total 750ms, 250ms after fetch completed)
        // Loading UI should still be visible (total 250ms since fetch completed, < 300ms)
        await act(() => vi.advanceTimersByTimeAsync(100))
        expect(result.current.isLoadingMore).toBe(true)

        // Wait another 100ms (total 850ms, 350ms after fetch completed)
        // Loading UI should now be hidden (> 300ms since fetch completed)
        await act(() => vi.advanceTimersByTimeAsync(100))
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
})
