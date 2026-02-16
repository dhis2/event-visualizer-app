import { act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    useDimensionList,
    transformResponseData,
    getFilterParamsFromBaseQuery,
    buildQuery,
    isFetchEnabledByFilter,
    filterDimensions,
    type ResponseData,
} from '../use-dimension-list'
import * as dimensionSelectionActions from '@store/dimensions-selection-slice'
import {
    dimensionSelectionSlice,
    setFilter,
    setSearchTerm,
    clearFilter,
} from '@store/dimensions-selection-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type { DimensionMetadataItem, SingleQuery, DimensionType } from '@types'

// ===== MOCK SETUP =====
let mockApiResponse: ResponseData | null = null
let mockApiError: Error | null = null
let mockInitiateCallCount = 0
let lastInitiateQuery: SingleQuery | null = null
let allInitiateQueries: SingleQuery[] = []

vi.mock('@api/api', () => {
    const mockQueryInitiate = vi.fn((query: SingleQuery) => {
        mockInitiateCallCount++
        lastInitiateQuery = query
        // Deep clone to prevent mutation issues
        allInitiateQueries.push(JSON.parse(JSON.stringify(query)))

        return () => {
            if (mockApiError) {
                return {
                    unwrap: vi.fn(async () => {
                        await new Promise((resolve) => setTimeout(resolve, 10))
                        throw mockApiError
                    }),
                }
            }

            return {
                unwrap: vi.fn(async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10))
                    return mockApiResponse || {}
                }),
            }
        }
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
            reducer: vi.fn((state = {}, action) => {
                void action
                return state
            }),
            middleware: vi.fn(() => (next) => (action) => next(action)),
            usePrefetch: vi.fn(),
            useQueryQuery: vi.fn(),
            useLazyQueryQuery: vi.fn(),
            useMutateMutation: vi.fn(),
        },
    }
})

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

describe('transformResponseData', () => {
    it('transforms API response correctly', () => {
        const mockApiResponse = {
            dataElements: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        const result = transformResponseData(mockApiResponse)
        expect(result.dimensions[0].id).toBe('api-id-1')
        expect(result.nextPage).toBe(2)
    })

    it('returns false hasMore on last page', () => {
        const mockApiResponse = {
            dataElements: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        const result = transformResponseData(mockApiResponse)
        expect(result.nextPage).toBe(null)
    })

    it('throws on invalid response', () => {
        expect(() =>
            transformResponseData({} as unknown as ResponseData)
        ).toThrow('Invalid response data')
    })

    it('handles empty dimensions array', () => {
        const mockApiResponse = {
            dataElements: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        } as unknown as ResponseData

        const result = transformResponseData(mockApiResponse)
        expect(result.dimensions).toEqual([])
        expect(result.nextPage).toBe(null)
    })

    it('throws when dimension array item is invalid', () => {
        const mockApiResponse = {
            dataElements: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    // missing dimensionType, dimensionItemType, valueType
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        expect(() => transformResponseData(mockApiResponse)).toThrow(
            'Dimensions array item is not a valid dimension dimension metadata item'
        )
    })

    it('handles different dimension key names', () => {
        const mockApiResponse = {
            programIndicators: [
                {
                    id: 'api-id-1',
                    name: 'API Program Indicator',
                    dimensionType: 'PROGRAM_INDICATOR',
                    dimensionItemType: 'PROGRAM_INDICATOR',
                    valueType: 'NUMBER',
                },
            ],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const result = transformResponseData(mockApiResponse)
        expect(result.dimensions[0].dimensionType).toBe('PROGRAM_INDICATOR')
        expect(result.nextPage).toBe(2)
    })

    it('throws when response has more than 2 keys', () => {
        const mockApiResponse = {
            dataElements: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
            extraKey: 'should not be here',
        } as unknown as ResponseData

        expect(() => transformResponseData(mockApiResponse)).toThrow(
            'Invalid response data'
        )
    })

    it('throws when pager is missing', () => {
        const mockApiResponse = {
            dataElements: [],
        } as unknown as ResponseData

        expect(() => transformResponseData(mockApiResponse)).toThrow(
            'Invalid response data'
        )
    })

    it('throws when pager properties are invalid', () => {
        const mockApiResponse = {
            dataElements: [],
            pager: { page: 'invalid', pageCount: 1, pageSize: 50, total: 0 },
        } as unknown as ResponseData

        expect(() => transformResponseData(mockApiResponse)).toThrow(
            'Invalid response data'
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
        const originalFilter = [...(baseQuery.params!.filter! as string[])]
        const result = buildQuery(baseQuery, 'test', 1)
        // Original should remain unchanged
        expect(baseQuery.params!.filter as string[]).toEqual(originalFilter)
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

    it('returns false for undefined baseQuery', () => {
        const result = isFetchEnabledByFilter(undefined, null)
        expect(result).toBe(false)
    })

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

describe('useDimensionList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApiResponse = null
        mockApiError = null
        mockInitiateCallCount = 0
        lastInitiateQuery = null
        allInitiateQueries = []
    })

    afterEach(async () => {
        // Wait for any pending promises to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
        })
    })

    const mockDimension: DimensionMetadataItem = {
        id: 'test-id',
        name: 'Test Dimension',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    }
    const fixedDimensions: DimensionMetadataItem[] = [mockDimension]
    const baseQuery: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }
    const mockApiDimension: DimensionMetadataItem = {
        id: 'api-id-1',
        name: 'API Dimension 1',
        dimensionType: 'DATA_ELEMENT',
        dimensionItemType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    }

    it('returns initial dimensions', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: null,
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current.dimensions).toEqual(fixedDimensions)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.loadMore).toBeDefined()
        expect(mockInitiateCallCount).toBe(0)
    })

    it('returns empty array without fixedDimensions', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: null,
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current.dimensions).toEqual([])
        expect(mockInitiateCallCount).toBe(0)
    })

    it('fetches when filter matches dimension type in query', async () => {
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Check initial loading state
        await waitFor(() => {
            expect(result.current.isLoading).toBe(true)
            expect(result.current.dimensions).toEqual([])
        })

        // Verify final state after fetch completes
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.dimensions).toEqual([mockApiDimension])
        })

        expect(mockInitiateCallCount).toBeGreaterThan(0)
        expect(lastInitiateQuery).not.toBeNull()
        expect(lastInitiateQuery?.resource).toBe('dimensions')
        expect(lastInitiateQuery?.params?.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
        ])
    })

    it('does not fetch when filter does not match dimension type in query', async () => {
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'PROGRAM_INDICATOR',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.dimensions).toEqual([])
        })

        expect(mockInitiateCallCount).toBe(0)
    })

    it('search triggers fetch when filter matches dimension type', async () => {
        // Setup API response
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch (filter matches)
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const initialCallCount = mockInitiateCallCount

        // Update search term
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        // Wait for search-triggered fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'PROGRAM_INDICATOR', // does not match DATA_ELEMENT in baseQuery
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // No API call expected because filter doesn't match
        expect(mockInitiateCallCount).toBe(0)
        // Initial dimensions should be filtered client-side by filter (none match)
        expect(result.current.dimensions).toEqual([])

        // Update search term
        act(() => {
            store.dispatch(setSearchTerm('Test'))
        })

        // Still no API call
        expect(mockInitiateCallCount).toBe(0)
        // Dimensions filtered client-side by search term (none match because filter already removed them)
        expect(result.current.dimensions).toEqual([])
    })

    it('loadMore function works and accumulates dimensions', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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
            dataElements: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for second fetch (use isFetching since isLoading is only for first load)
        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        expect(mockInitiateCallCount).toBe(2)
        expect(lastInitiateQuery?.params?.page).toBe(2)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    // ===== Advanced hook tests =====

    it('shows loading state during fetch and error state after failure', async () => {
        mockApiError = new Error('API Error')

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Check loading state before error
        await waitFor(() => {
            expect(result.current.isLoading).toBe(true)
            expect(result.current.error).toBeUndefined()
        })

        // Check error state after promise resolves
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toHaveProperty('message', 'API Error')
            expect(result.current.error).toHaveProperty('type', 'runtime')
        })
    })

    it('handles rapid search term changes - latest search term wins', async () => {
        mockApiResponse = {
            dataElements: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        } as unknown as ResponseData

        const { store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Clear previous calls from initial fetch
        mockInitiateCallCount = 0
        allInitiateQueries = []

        // Rapidly change search term multiple times
        act(() => {
            store.dispatch(setSearchTerm('a'))
            store.dispatch(setSearchTerm('ab'))
            store.dispatch(setSearchTerm('abc'))
        })

        // Wait for fetch to complete (should be for 'abc')
        await waitFor(() => {
            expect(mockInitiateCallCount).toBeGreaterThan(0)
        })

        // Verify the last query contains the latest search term
        expect(lastInitiateQuery).not.toBeNull()
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:abc'
        )
    })

    it('combines filtered fixedDimensions with fetched results during search', async () => {
        // Setup initial dimensions (client-side data)
        const fixedDimensions: DimensionMetadataItem[] = [
            {
                id: 'initial-1',
                name: 'Test Initial Item',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            {
                id: 'initial-2',
                name: 'Another Initial Item',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            {
                id: 'initial-3',
                name: 'Different Item',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
        ]

        // Setup initial fetch response (page 1, no search)
        const fetchedDimension1 = {
            ...mockApiDimension,
            id: 'fetched-1',
            name: 'Fetched Dimension 1',
        }
        mockApiResponse = {
            dataElements: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Verify initial state: fixedDimensions + fetchedDimensions
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            fetchedDimension1,
        ])

        // Setup search response
        const searchFetchedDimension = {
            ...mockApiDimension,
            id: 'search-fetched-1',
            name: 'Test Search Result',
        }
        mockApiResponse = {
            dataElements: [searchFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Apply search for "Test"
        act(() => {
            store.dispatch(setSearchTerm('Test'))
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

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
            {
                id: 'initial-de-1',
                name: 'Initial Data Element',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            {
                id: 'initial-pi-1',
                name: 'Initial Program Indicator',
                dimensionType: 'PROGRAM_INDICATOR',
                valueType: 'NUMBER',
            },
            {
                id: 'initial-de-2',
                name: 'Another Data Element',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
        ]

        // Setup fetched dimensions (DATA_ELEMENT type from baseQuery)
        const fetchedDimension1 = {
            ...mockApiDimension,
            id: 'fetched-de-1',
            name: 'Fetched Data Element',
            dimensionType: 'DATA_ELEMENT' as DimensionType,
        }
        mockApiResponse = {
            dataElements: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: null, // No filter initially
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Verify initial state with no filter: all fixedDimensions + fetchedDimensions
        expect(result.current.dimensions).toEqual([
            ...fixedDimensions,
            fetchedDimension1,
        ])

        // Apply DATA_ELEMENT filter
        act(() => {
            store.dispatch(setFilter('DATA_ELEMENT'))
        })

        // Should show only DATA_ELEMENT items from fixedDimensions + all fetchedDimensions
        // (fetchedDimensions are not filtered client-side, they come from server-side filter)
        expect(result.current.dimensions).toEqual([
            fixedDimensions[0], // Initial Data Element
            fixedDimensions[2], // Another Data Element
            fetchedDimension1, // Fetched Data Element (always included)
        ])

        // Apply PROGRAM_INDICATOR filter
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // Should show only PROGRAM_INDICATOR items from fixedDimensions
        // fetchedDimensions persist (they were fetched with baseQuery for DATA_ELEMENT)
        // Note: No new fetch happens because filter doesn't match baseQuery
        expect(result.current.dimensions).toEqual([
            fixedDimensions[1], // Initial Program Indicator
            fetchedDimension1, // Fetched dimensions persist (not filtered client-side)
        ])

        // Apply filter that matches no items
        act(() => {
            store.dispatch(setFilter('CATEGORY'))
        })

        // Should show only fetchedDimensions (no fixedDimensions match CATEGORY)
        // fetchedDimensions persist from previous fetch
        expect(result.current.dimensions).toEqual([fetchedDimension1])

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
        const initialFetchedDimension = {
            ...mockApiDimension,
            id: 'initial-fetched',
            name: 'Initial Fetched',
        }
        mockApiResponse = {
            dataElements: [initialFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.dimensions).toEqual([initialFetchedDimension])

        // Setup search response
        const searchDimension = {
            ...mockApiDimension,
            id: 'search-result',
            name: 'Search Result',
        }
        mockApiResponse = {
            dataElements: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('search'))
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        expect(result.current.dimensions).toEqual([searchDimension])
        expect(result.current.isSearching).toBe(false)

        // Setup response for cleared search (back to original)
        const clearedSearchDimension = {
            ...mockApiDimension,
            id: 'cleared-search',
            name: 'Cleared Search Result',
        }
        mockApiResponse = {
            dataElements: [clearedSearchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Clear search term (set to empty string)
        act(() => {
            store.dispatch(setSearchTerm(''))
        })

        // Should trigger isSearching since initial fetch already succeeded
        await waitFor(() => {
            expect(result.current.isSearching).toBe(true)
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        // Verify refetch occurred with cleared search
        expect(result.current.dimensions).toEqual([clearedSearchDimension])
        expect(lastInitiateQuery?.params?.filter).not.toContain(
            'displayName:ilike:'
        )
        expect(result.current.isSearching).toBe(false)
    })

    it('handles error during loadMore', async () => {
        // Setup page 1 successfully
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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

        // Wait for error
        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        // Should set error but preserve page 1 data
        expect(result.current.error).toHaveProperty(
            'message',
            'Page 2 Load Error'
        )
        expect(result.current.error).toHaveProperty('type', 'runtime')
        expect(result.current.dimensions).toEqual([mockApiDimension])
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

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    // No baseQuery provided
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: null,
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
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

    it('cleans up loading state on unmount', async () => {
        const removeLoadingStateSpy = vi.spyOn(
            dimensionSelectionActions,
            'removeDimensionListLoadingState'
        )

        // Set up mock response to allow the fetch to complete
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        const { unmount, result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for the fetch to complete before unmounting
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Unmount hook
        unmount()

        // Verify cleanup action was called
        expect(removeLoadingStateSpy).toHaveBeenCalledWith('program-indicators')
    })

    // ===== Sequence tests =====

    it('handles loadMore followed by filter change', async () => {
        // Setup page 1 with hasMore
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.hasMore).toBe(true)
        })

        // Setup page 2
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dataElements: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        // Load more (page 2)
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.dimensions).toEqual([
                mockApiDimension,
                secondDimension,
            ])
        })

        expect(mockInitiateCallCount).toBe(2)
        const callCountAfterLoadMore = mockInitiateCallCount

        // Change filter to non-matching
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // Should preserve both pages of data, hasMore becomes false, no new fetch
        expect(mockInitiateCallCount).toBe(callCountAfterLoadMore)
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
        expect(result.current.hasMore).toBe(false)
    })

    it('handles loadMore followed by search term change', async () => {
        // Setup page 1
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.dimensions).toEqual([mockApiDimension])
        })

        // Setup page 2
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dataElements: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        // Load more
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

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
            dataElements: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Change search term - should reset to page 1 and clear previous data
        act(() => {
            store.dispatch(setSearchTerm('search'))
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        // Verify data was reset and only search results are shown
        expect(result.current.dimensions).toEqual([searchDimension])
        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:search'
        )
    })

    it('handles search followed by loadMore', async () => {
        // Setup initial search results (page 1)
        const searchDimension1 = {
            ...mockApiDimension,
            id: 'search-id-1',
            name: 'Search Result 1',
        }
        mockApiResponse = {
            dataElements: [searchDimension1],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch (empty search)
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        expect(result.current.dimensions).toEqual([searchDimension1])

        // Verify search filter was applied
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:test'
        )
        expect(result.current.hasMore).toBe(true)

        // Setup page 2 of search results
        const searchDimension2 = {
            ...mockApiDimension,
            id: 'search-id-2',
            name: 'Search Result 2',
        }
        mockApiResponse = {
            dataElements: [searchDimension2],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        // Load more
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        // Verify both pages have search filter and data accumulates
        expect(result.current.dimensions).toEqual([
            searchDimension1,
            searchDimension2,
        ])
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:test'
        )
        expect(lastInitiateQuery?.params?.page).toBe(2)
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

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    fixedDimensions,
                    baseQuery, // baseQuery has DATA_ELEMENT filter
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'PROGRAM_INDICATOR', // doesn't match DATA_ELEMENT
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
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
            dataElements: [dimension1],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for page 1
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.dimensions).toEqual([dimension1])
        })

        expect(allInitiateQueries[0]?.params?.page).toBe(1)

        // Setup page 2
        const dimension2 = { ...mockApiDimension, id: 'id-2', name: 'Dim 2' }
        mockApiResponse = {
            dataElements: [dimension2],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        // Load more (page 2)
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([dimension1, dimension2])
        })

        expect(allInitiateQueries[1]?.params?.page).toBe(2)

        // Setup page 3
        const dimension3 = { ...mockApiDimension, id: 'id-3', name: 'Dim 3' }
        mockApiResponse = {
            dataElements: [dimension3],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        } as unknown as ResponseData

        // Load more (page 3)
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([
                dimension1,
                dimension2,
                dimension3,
            ])
        })

        expect(allInitiateQueries[2]?.params?.page).toBe(3)
        expect(result.current.hasMore).toBe(false)
    })

    it('recovers from error when search term changes', async () => {
        // Start with API error
        mockApiError = new Error('Initial API Error')

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for error
        await waitFor(() => {
            expect(result.current.error).toHaveProperty(
                'message',
                'Initial API Error'
            )
            expect(result.current.isLoading).toBe(false)
        })

        // Clear error and setup successful response
        mockApiError = null
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Change search term
        act(() => {
            store.dispatch(setSearchTerm('new'))
        })

        // Wait for successful fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Verify error cleared and data loaded
        expect(result.current.error).toBeUndefined()
        expect(result.current.dimensions).toEqual([mockApiDimension])
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:new'
        )
    })

    it('resets pagination when search changes after loadMore', async () => {
        // Setup page 1 for first search
        const firstSearch1 = {
            ...mockApiDimension,
            id: 'first-1',
            name: 'First Search 1',
        }
        mockApiResponse = {
            dataElements: [firstSearch1],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Apply first search
        act(() => {
            store.dispatch(setSearchTerm('first'))
        })

        // Wait for search to complete
        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        expect(result.current.dimensions).toEqual([firstSearch1])

        // Setup page 2 of first search
        const firstSearch2 = {
            ...mockApiDimension,
            id: 'first-2',
            name: 'First Search 2',
        }
        mockApiResponse = {
            dataElements: [firstSearch2],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for loadMore to complete
        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        expect(result.current.dimensions).toEqual([firstSearch1, firstSearch2])

        // Setup page 1 for second search
        const secondSearch1 = {
            ...mockApiDimension,
            id: 'second-1',
            name: 'Second Search 1',
        }
        mockApiResponse = {
            dataElements: [secondSearch1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Change search term - should clear previous data and start from page 1
        act(() => {
            store.dispatch(setSearchTerm('second'))
        })

        await waitFor(() => {
            expect(result.current.isFetching).toBe(false)
        })

        // Verify pagination reset and data cleared
        expect(result.current.dimensions).toEqual([secondSearch1])
        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:second'
        )
    })

    it('tracks isLoading, isFetching and isSearching states correctly', async () => {
        // Setup page 1
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
                }),
            {
                partialStore: {
                    reducer: {
                        dimensionSelection: dimensionSelectionSlice.reducer,
                    },
                    preloadedState: {
                        dimensionSelection: {
                            dataSourceId: null,
                            searchTerm: '',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Initial state
        expect(result.current.isLoading).toBe(true)
        expect(result.current.isFetching).toBe(true)
        expect(result.current.isSearching).toBe(false)

        // Stage 1: After initial data loads
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isFetching).toBe(false)
            expect(result.current.isSearching).toBe(false)
            expect(result.current.dimensions).toEqual([mockApiDimension])
        })

        // Stage 2: load more
        const secondDimension = {
            ...mockApiDimension,
            id: 'api-id-2',
            name: 'API Dimension 2',
        }
        mockApiResponse = {
            dataElements: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        } as unknown as ResponseData

        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isFetching).toBe(true)
            expect(result.current.isSearching).toBe(false)
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isFetching).toBe(false)
            expect(result.current.isSearching).toBe(false)
            expect(result.current.dimensions).toEqual([
                mockApiDimension,
                secondDimension,
            ])
        })

        // Stage 3: Trigger search
        const searchDimension = {
            ...mockApiDimension,
            id: 'search-id',
            name: 'Search Result',
        }
        mockApiResponse = {
            dataElements: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        act(() => {
            store.dispatch(setSearchTerm('test'))
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isFetching).toBe(true)
            expect(result.current.isSearching).toBe(true)
        })

        // Wait for search to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isFetching).toBe(false)
            expect(result.current.isSearching).toBe(false)
            expect(result.current.dimensions).toEqual([searchDimension])
        })
    })
})
