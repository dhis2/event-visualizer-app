import { act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
    useDimensionList,
    transformResponseData,
    type ResponseData,
} from '../use-dimension-list'
import { type EngineError } from '@api/parse-engine-error'
import {
    dimensionSelectionSlice,
    setFilter,
} from '@store/dimensions-selection-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type { DimensionMetadataItem, SingleQuery } from '@types'

// ===== MOCK SETUP =====
let mockApiResponse: ResponseData | null = null
let mockApiError: EngineError | null = null
let mockInitiateCallCount = 0
let lastInitiateQuery: SingleQuery | null = null

vi.mock('@api/api', () => {
    const mockQueryInitiate = vi.fn((query: SingleQuery) => {
        mockInitiateCallCount++
        lastInitiateQuery = query

        return () => {
            if (mockApiError) {
                return {
                    unwrap: vi.fn(() => Promise.reject(mockApiError)),
                }
            }

            return {
                unwrap: vi.fn(() => Promise.resolve(mockApiResponse || {})),
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
        expect(result.hasMore).toBe(true)
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
        expect(result.hasMore).toBe(false)
    })

    it('throws on invalid response', () => {
        expect(() =>
            transformResponseData({} as unknown as ResponseData)
        ).toThrow('Invalid response data')
    })
})

describe('useDimensionList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApiResponse = null
        mockApiError = null
        mockInitiateCallCount = 0
        lastInitiateQuery = null
    })

    // ===== client-side tests =====
    const mockDimension: DimensionMetadataItem = {
        id: 'test-id',
        name: 'Test Dimension',
        dimensionType: 'DATA_ELEMENT',
    }

    const initialDimensions: DimensionMetadataItem[] = [mockDimension]

    it('returns initial dimensions', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useDimensionList({
                    dimensionListKey: 'program-indicators',
                    initialDimensions,
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

        expect(result.current.dimensions).toEqual(initialDimensions)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasMore).toBe(false)
        expect(result.current.loadMore).toBeDefined()
        expect(mockInitiateCallCount).toBe(0)
    })

    it('returns empty array without initialDimensions', async () => {
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

    // ===== integration tests =====
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

    it('fetches when filter matches dimension type in query', async () => {
        // Setup API response
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

        // Wait for effects
        await act(() => Promise.resolve())

        expect(mockInitiateCallCount).toBeGreaterThan(0)
        expect(lastInitiateQuery).not.toBeNull()
        expect(lastInitiateQuery?.resource).toBe('dimensions')
        expect(lastInitiateQuery?.params?.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
        ])
        expect(result.current.dimensions).toEqual([mockApiDimension])
        expect(result.current.isLoading).toBe(false)
    })

    it('does not fetch when filter does not match dimension type in query', async () => {
        // Setup API response
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

        // Wait for effects
        await act(() => Promise.resolve())

        // Should not fetch because filter doesn't match dimension type in query
        expect(mockInitiateCallCount).toBe(0)
        expect(result.current.dimensions).toEqual([])
    })

    it('preserves fetched data when filter changes to non-matching', async () => {
        // Setup API response
        mockApiResponse = {
            dataElements: [mockApiDimension],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
        } as unknown as ResponseData

        // Start with matching filter
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
        await act(() => Promise.resolve())

        const initialCallCount = mockInitiateCallCount
        expect(result.current.dimensions).toEqual([mockApiDimension])

        // Change filter to non-matching
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        // Should not make additional API call when filter changes
        expect(mockInitiateCallCount).toBe(initialCallCount)
        // Fetched data should still be in dimensions array
        expect(result.current.dimensions).toEqual([mockApiDimension])
    })
})
