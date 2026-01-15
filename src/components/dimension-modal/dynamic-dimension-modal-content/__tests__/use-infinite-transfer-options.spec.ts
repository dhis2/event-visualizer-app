import type { QueryStatus } from '@reduxjs/toolkit/query'
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FetchItemsByDimensionQueryArgs } from '../dimensions-api'
import { useInfiniteTransferOptions } from '../use-infinite-transfer-options'

type MockData = {
    items: Array<{ id: string; name: string }>
    nextPage: number | null
}

type MockState = {
    data?: MockData
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    isSuccess: boolean
    isUninitialized: boolean
    error: undefined
    currentData?: MockData
    originalArgs: undefined
    requestId: undefined
    endpointName: undefined
    startedTimeStamp: undefined
    fulfilledTimeStamp: undefined
    status: QueryStatus
    reset: () => void
}

const baseMockState: Omit<
    MockState,
    | 'data'
    | 'currentData'
    | 'isSuccess'
    | 'isUninitialized'
    | 'status'
    | 'reset'
> = {
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    originalArgs: undefined,
    requestId: undefined,
    endpointName: undefined,
    startedTimeStamp: undefined,
    fulfilledTimeStamp: undefined,
}

const createMockLazyQueryResult = (data?: MockData) => {
    const triggerFn = vi.fn()
    const state: MockState = {
        ...baseMockState,
        data,
        currentData: data,
        isSuccess: !!data,
        isUninitialized: !data,
        status: (data ? 'fulfilled' : 'uninitialized') as QueryStatus,
        reset: vi.fn(),
    }
    const lastPromiseInfo = {
        lastArg: {
            dimensionId: 'ou',
            page: 1,
            searchTerm: '',
        } as FetchItemsByDimensionQueryArgs,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [triggerFn, state, lastPromiseInfo] as any
}

describe('useInfiniteTransferOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    describe('initialization', () => {
        it('returns initial state with empty data array', () => {
            const mockQueryResult = createMockLazyQueryResult()
            const [triggerFn, state] = mockQueryResult
            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            expect(result.current.data).toEqual([])
            expect(result.current.searchTerm).toBe('')
            expect(result.current.isLoading).toBe(false)
            expect(typeof result.current.setSearchTerm).toBe('function')
            expect(typeof result.current.onEndReached).toBe('function')
        })

        it('preserves all state properties from lazy query result', () => {
            const mockQueryResult = createMockLazyQueryResult()
            const [triggerFn, state] = mockQueryResult
            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            expect(result.current.isError).toBe(false)
            expect(result.current.isSuccess).toBe(false)
            expect(result.current.isFetching).toBe(false)
            expect(result.current.isUninitialized).toBe(true)
        })
    })

    describe('onEndReached', () => {
        it('calls fetch function with correct arguments on initial call', () => {
            const mockQueryResult = createMockLazyQueryResult()
            const [triggerFn, state] = mockQueryResult
            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            act(() => {
                result.current.onEndReached()
            })

            expect(triggerFn).toHaveBeenCalledWith({
                dimensionId: 'ou',
                page: 1,
            })
        })

        it('does not call fetch function when nextPage is null', async () => {
            const mockData: MockData = {
                items: [{ id: 'ou1', name: 'Org Unit 1' }],
                nextPage: null,
            }
            const triggerFn = vi.fn()
            const state: MockState = {
                ...baseMockState,
                data: mockData,
                currentData: mockData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            // Wait for initial data to be processed
            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            // Clear the mock to check subsequent calls
            vi.clearAllMocks()

            act(() => {
                result.current.onEndReached()
            })

            // Should not call trigger when nextPage is null
            expect(triggerFn).not.toHaveBeenCalled()
        })

        it('increments page number for subsequent calls', async () => {
            const mockData: MockData = {
                items: [{ id: 'ou1', name: 'Org Unit 1' }],
                nextPage: 2,
            }
            const triggerFn = vi.fn()
            const state: MockState = {
                ...baseMockState,
                data: mockData,
                currentData: mockData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            // Wait for initial data to be processed
            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            act(() => {
                result.current.onEndReached()
            })

            expect(triggerFn).toHaveBeenCalledWith({
                dimensionId: 'ou',
                page: 2,
                searchTerm: '',
            })
        })
    })

    describe('data transformation', () => {
        it('transforms dimension items to transfer options format', async () => {
            const mockData: MockData = {
                items: [
                    { id: 'ou1', name: 'Org Unit 1' },
                    { id: 'ou2', name: 'Org Unit 2' },
                ],
                nextPage: 2,
            }
            const triggerFn = vi.fn()
            const state: MockState = {
                ...baseMockState,
                data: mockData,
                currentData: mockData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            await vi.waitFor(() => {
                expect(result.current.data).toEqual([
                    { label: 'Org Unit 1', value: 'ou1' },
                    { label: 'Org Unit 2', value: 'ou2' },
                ])
            })
        })

        it('appends new items to existing data', async () => {
            const initialData: MockData = {
                items: [{ id: 'ou1', name: 'Org Unit 1' }],
                nextPage: 2,
            }
            const triggerFn = vi.fn()
            let state: MockState = {
                ...baseMockState,
                data: initialData,
                currentData: initialData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result, rerender } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            // Simulate fetching page 2
            const newData: MockData = {
                items: [{ id: 'ou2', name: 'Org Unit 2' }],
                nextPage: null,
            }
            state = { ...state, data: newData }
            rerender()

            await vi.waitFor(() => {
                expect(result.current.data).toEqual([
                    { label: 'Org Unit 1', value: 'ou1' },
                    { label: 'Org Unit 2', value: 'ou2' },
                ])
            })
        })
    })

    describe('search functionality', () => {
        it('updates search term when setSearchTerm is called', () => {
            const mockQueryResult = createMockLazyQueryResult()
            const [triggerFn, state] = mockQueryResult
            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            act(() => {
                result.current.setSearchTerm('district')
            })

            expect(result.current.searchTerm).toBe('district')
        })

        it('resets options and fetches with search term when debounced search changes', async () => {
            const initialData: MockData = {
                items: [{ id: 'ou1', name: 'Org Unit 1' }],
                nextPage: null,
            }
            const triggerFn = vi.fn()
            const state: MockState = {
                ...baseMockState,
                data: initialData,
                currentData: initialData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            // Clear previous calls
            vi.clearAllMocks()

            // Change search term
            act(() => {
                result.current.setSearchTerm('district')
            })

            // Advance timers past debounce delay (500ms)
            act(() => {
                vi.advanceTimersByTime(500)
            })

            await vi.waitFor(() => {
                expect(triggerFn).toHaveBeenCalledWith({
                    dimensionId: 'ou',
                    page: 1,
                    searchTerm: 'district',
                })
            })

            // Options should be cleared when search changes
            await vi.waitFor(() => {
                expect(result.current.data).toEqual([])
            })
        })

        it('omits searchTerm param when search is empty', async () => {
            const mockQueryResult = createMockLazyQueryResult()
            const [triggerFn, state] = mockQueryResult

            const { result } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            // Set search term
            act(() => {
                result.current.setSearchTerm('test')
            })

            // Advance past debounce
            act(() => {
                vi.advanceTimersByTime(500)
            })

            vi.clearAllMocks()

            // Clear search term
            act(() => {
                result.current.setSearchTerm('')
            })

            // Advance past debounce
            act(() => {
                vi.advanceTimersByTime(500)
            })

            await vi.waitFor(() => {
                expect(triggerFn).toHaveBeenCalledWith({
                    dimensionId: 'ou',
                    page: 1,
                })
            })
        })

        it('preserves search term when onEndReached is called during search', async () => {
            const initialData: MockData = {
                items: [{ id: 'ou1', name: 'District 1' }],
                nextPage: 2,
            }
            const triggerFn = vi.fn()
            let state: MockState = {
                ...baseMockState,
                data: initialData,
                currentData: initialData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }

            const { result, rerender } = renderHook(() =>
                useInfiniteTransferOptions('ou', triggerFn, state)
            )

            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            // Perform a search
            act(() => {
                result.current.setSearchTerm('district')
            })

            // Advance past debounce
            act(() => {
                vi.advanceTimersByTime(500)
            })

            // Wait for search to be triggered
            await vi.waitFor(() => {
                expect(triggerFn).toHaveBeenCalledWith({
                    dimensionId: 'ou',
                    page: 1,
                    searchTerm: 'district',
                })
            })

            // Update state to simulate search results with nextPage
            const searchResultData: MockData = {
                items: [{ id: 'ou2', name: 'District 2' }],
                nextPage: 2,
            }
            state = {
                ...baseMockState,
                data: searchResultData,
                currentData: searchResultData,
                isSuccess: true,
                isUninitialized: false,
                status: 'fulfilled' as QueryStatus,
                reset: vi.fn(),
            }
            rerender()

            // Wait for search results to be processed
            await vi.waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })

            // Clear mocks to check next call
            vi.clearAllMocks()

            // Now call onEndReached to load more search results
            act(() => {
                result.current.onEndReached()
            })

            // Should preserve the search term when paginating
            expect(triggerFn).toHaveBeenCalledWith({
                dimensionId: 'ou',
                page: 2,
                searchTerm: 'district',
            })
        })
    })
})
