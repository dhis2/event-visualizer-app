import { act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    useDimensionList,
    defaultTransformer,
    getFilterParamsFromBaseQuery,
    buildQuery,
    isFetchEnabledByFilter,
    filterDimensions,
    computeIsDisabledByFilter,
    type Transformer,
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
let mockApiResponse: unknown = null
let mockApiError: Error | null = null
let mockInitiateCallCount = 0
let lastInitiateQuery: SingleQuery | null = null
let allInitiateQueries: SingleQuery[] = []
let mockApiDelay = 10 // Default delay in ms

vi.mock('@api/api', () => {
    const createUnwrapPromise = async () => {
        await new Promise((resolve) => setTimeout(resolve, mockApiDelay))
        if (mockApiError) {
            throw mockApiError
        }
        return mockApiResponse || {}
    }

    const mockQueryInitiate = vi.fn((query: SingleQuery) => {
        mockInitiateCallCount++
        lastInitiateQuery = query
        // Deep clone to prevent mutation issues
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

describe('useDimensionList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApiResponse = null
        mockApiError = null
        mockInitiateCallCount = 0
        lastInitiateQuery = null
        allInitiateQueries = []
        mockApiDelay = 10 // Reset to default delay
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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

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
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 2, pageSize: 50, total: 100 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        // Wait for 400ms delay to expire, then check isLoadingMore is true
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 450))
        })

        // After delay expires, if fetch is still ongoing, isLoadingMore should be true
        // Note: The API mock returns after 10ms, so by 450ms the fetch might be done
        // We check that the fetch happened and dimensions were accumulated
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
        })

        expect(mockInitiateCallCount).toBe(2)
        expect(lastInitiateQuery?.params?.page).toBe(2)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    it('isLoadingMore respects 400ms delay - does not show loading immediately', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

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

        // Setup API response for page 2 with SLOW response (600ms)
        // This ensures the fetch is still ongoing after the 400ms delay
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

        // Immediately after loadMore, isLoadingMore should be false (delay is active)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait 200ms (still within delay period)
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 200))
        })

        // isLoadingMore should still be false (delay still active)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait for delay to expire (another 250ms, total > 400ms)
        // At this point the fetch is still ongoing (600ms total), so isLoadingMore should be true
        await waitFor(
            () => {
                expect(result.current.isLoadingMore).toBe(true)
            },
            { timeout: 300 }
        )

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.isLoadingMore).toBe(false)
        })

        expect(result.current.dimensions).toEqual([
            mockApiDimension,
            secondDimension,
        ])
    })

    it('isLoadingMore remains false when fetch completes before 400ms delay', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

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

        // Setup API response for page 2 (fast response - 10ms, completes before 400ms delay)
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
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([
                mockApiDimension,
                secondDimension,
            ])
        })

        // isLoadingMore should never have been true (fetch completed before 400ms delay)
        expect(result.current.isLoadingMore).toBe(false)

        // Wait for delay to expire (400ms)
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 450))
        })

        // isLoadingMore should still be false (fetch already completed)
        expect(result.current.isLoadingMore).toBe(false)
    })

    it('cleans up delay timer on component unmount', async () => {
        // Setup API response for page 1 (hasMore true)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

        const { result, unmount } = await renderHookWithAppWrapper(
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
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        })

        // No errors should occur from state updates after unmount
        // This test passes if no warnings/errors are thrown
    })

    it('hasNoData is true when server returns empty result without search', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

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

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasNoData).toBe(true)
        expect(result.current.dimensions).toEqual([])
    })

    it('hasNoData is false when server returns empty result with search', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

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
                            searchTerm: 'test',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasNoData).toBe(false)
        expect(result.current.dimensions).toEqual([])
    })

    it('hasNoData is false when server returns data', async () => {
        // Setup API response with data
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasNoData).toBe(false)
        expect(result.current.dimensions).toEqual([mockApiDimension])
    })

    it('hasNoData is false when there are fixed dimensions even if server returns empty', async () => {
        // Setup API response with 0 total items
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result } = await renderHookWithAppWrapper(
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

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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
                            searchTerm: 'test',
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch with search
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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

        // Wait for hasNoData to update
        await waitFor(() => {
            expect(result.current.hasNoData).toBe(true)
        })
    })

    it('hasNoData is true only when no fixed dimensions AND no server data AND no search', async () => {
        // Test 1: No fixed dimensions, no server data, no search
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    // No fixed dimensions
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
        })

        // Should be true: no fixed dims, no server data, no search
        expect(result.current.hasNoData).toBe(true)

        // Test 2: Add fixed dimensions (use different key to avoid state conflict)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result: result2 } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-tracked-entity-type', // Different valid key
                    fixedDimensions, // Now has fixed dimensions
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
            expect(result2.current.isLoading).toBe(false)
        })

        // Should be false: has fixed dimensions
        expect(result2.current.hasNoData).toBe(false)

        // Test 3: Add search term (use another different key)
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const { result: result3 } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'event-without-registration', // Different valid key
                    // No fixed dimensions
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
                            searchTerm: 'test', // Has search term
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
            expect(result3.current.isLoading).toBe(false)
        })

        // Should be false: has search term
        expect(result3.current.hasNoData).toBe(false)
    })

    it('hasNoData is sticky during search - retains value from before search', async () => {
        // Test 1: Start with no data, then search
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

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
                            searchTerm: '', // No search initially
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        // Wait for initial fetch (no search, no data)
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // hasNoData should remain true (sticky during search)
        expect(result.current.hasNoData).toBe(true)

        // Test 2: Start with data, then search
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        const { result: result2, store: store2 } =
            await renderHookWithAppWrapper(
                () =>
                    useDimensionList({
                        dimensionListKey: 'program-tracked-entity-type', // Different key
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
                                searchTerm: '', // No search initially
                                filter: 'DATA_ELEMENT',
                                dimensionCardCollapseStates: {},
                                dimensionListLoadingStates: {},
                                multiSelectedDimensionIds: [],
                            },
                        },
                    },
                }
            )

        // Wait for initial fetch (no search, has data)
        await waitFor(() => {
            expect(result2.current.isLoading).toBe(false)
        })

        // Should be false: no search, has data
        expect(result2.current.hasNoData).toBe(false)

        // Setup search response
        mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        // Apply search
        act(() => {
            store2.dispatch(setSearchTerm('test'))
        })

        // Wait for search fetch
        await waitFor(() => {
            expect(result2.current.isLoading).toBe(false)
        })

        // hasNoData should remain false (sticky during search)
        expect(result2.current.hasNoData).toBe(false)
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
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

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
            dimensions: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [searchFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Apply search for "Test"
        act(() => {
            store.dispatch(setSearchTerm('Test'))
        })

        // Verify search results combine:
        // 1. Client-side filtered fixedDimensions (only "Test Initial Item" matches)
        // 2. Server-side filtered fetched results
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([
                fixedDimensions[0], // "Test Initial Item" matches "Test"
                searchFetchedDimension, // "Test Search Result" from API
            ])
        })

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
            dimensions: [fetchedDimension1],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
        const initialFetchedDimension = {
            ...mockApiDimension,
            id: 'initial-fetched',
            name: 'Initial Fetched',
        }
        mockApiResponse = {
            dimensions: [initialFetchedDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [searchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Apply search
        act(() => {
            store.dispatch(setSearchTerm('search'))
        })

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([searchDimension])
        })

        // Setup response for cleared search (back to original)
        const clearedSearchDimension = {
            ...mockApiDimension,
            id: 'cleared-search',
            name: 'Cleared Search Result',
        }
        mockApiResponse = {
            dimensions: [clearedSearchDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

        // Clear search term (set to empty string)
        act(() => {
            store.dispatch(setSearchTerm(''))
        })

        // Verify refetch occurred with cleared search
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([clearedSearchDimension])
        })
        expect(lastInitiateQuery?.params?.filter).not.toContain(
            'displayName:ilike:'
        )
    })

    it('handles error during loadMore', async () => {
        // Setup page 1 successfully
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

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
            expect(result.current.error).toHaveProperty(
                'message',
                'Page 2 Load Error'
            )
        })

        // Should set error but preserve page 1 data
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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

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
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

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
            dimensions: [secondDimension],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

        // Load more
        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([
                mockApiDimension,
                secondDimension,
            ])
        })

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

        // Verify data was reset and only search results are shown
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([searchDimension])
        })
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

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([searchDimension1])
        })

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

        // Wait for loadMore to start (after 400ms delay)
        await waitFor(() => {
            expect(result.current.isLoadingMore).toBe(true)
        })

        // Wait for loadMore to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
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
            dimensions: [dimension1],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

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
            dimensions: [dimension2],
            pager: { page: 2, pageCount: 3, pageSize: 50, total: 150 },
        }

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
            dimensions: [dimension3],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        }

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
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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
        // Setup initial fetch response (no search)
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        }

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

        // Wait for search to complete
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([firstSearch1])
        })

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

        // Wait for loadMore to start (after 400ms delay)
        await waitFor(() => {
            expect(result.current.isLoadingMore).toBe(true)
        })

        // Wait for loadMore to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
        })

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

        await waitFor(() => {
            expect(result.current.dimensions).toEqual([secondSearch1])
        })

        // Verify pagination reset and data cleared
        expect(result.current.dimensions).toEqual([secondSearch1])
        expect(lastInitiateQuery?.params?.page).toBe(1)
        expect(lastInitiateQuery?.params?.filter).toContain(
            'displayName:ilike:second'
        )
    })

    it('tracks isLoading and isLoadingMore states correctly', async () => {
        // Setup page 1
        mockApiResponse = {
            dimensions: [mockApiDimension],
            pager: { page: 1, pageCount: 2, pageSize: 50, total: 100 },
        }

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
        expect(result.current.isLoadingMore).toBe(false)

        // Stage 1: After initial data loads
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
            expect(result.current.dimensions).toEqual([mockApiDimension])
        })

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

        // Wait for delay to expire and loading to show
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(true)
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
            expect(result.current.dimensions).toEqual([
                mockApiDimension,
                secondDimension,
            ])
        })

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
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isLoadingMore).toBe(false)
            expect(result.current.dimensions).toEqual([searchDimension])
        })
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

        // Wait for initial fetch to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

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
        await waitFor(() => {
            expect(result.current.dimensions).toEqual([
                fixedDimensions[0], // Apple
                searchFetchedDimension,
            ])
        })

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
                            filter: 'PROGRAM_INDICATOR', // does not match DATA_ELEMENT
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
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

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery,
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
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
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

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
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

        // Should return fixed dimensions without any API calls
        expect(result.current.dimensions).toEqual(fixedDimensions)
        expect(result.current.isLoading).toBe(false)
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

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
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

        // Should not fetch even though filter matches baseQuery
        expect(result.current.dimensions).toEqual([])
        expect(result.current.isLoading).toBe(false)
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

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    // No dimensionListKey provided
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

        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    baseQuery: {
                        resource: 'trackedEntityTypes',
                    } as SingleQuery,
                    transformer: customTransformer,
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

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(customTransformer).toHaveBeenCalledWith(mockApiResponse)
        expect(result.current.dimensions).toHaveLength(2)
        expect(result.current.dimensions[0].id).toBe('attr-1')
        expect(result.current.dimensions[0].name).toBe('Attribute 1')
        expect(result.current.hasMore).toBe(false) // No pager in response
    })
})
