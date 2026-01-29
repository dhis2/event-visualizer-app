import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useDataSourceOptions } from '../use-data-source-options'
import { useCurrentUser, useRtkQuery } from '@hooks'
import type { UseRtkQueryResult } from '@hooks'

vi.mock('@hooks', () => ({
    useCurrentUser: vi.fn(() => ({
        name: 'Test User',
        settings: {
            displayNameProperty: 'displayName' as const,
            dbLocale: 'en',
            uiLocale: 'en',
            displayProperty: 'name',
        },
    })),
    useRtkQuery: vi.fn(() => ({
        isLoading: true,
        isError: false,
        error: undefined,
        data: undefined,
        isFetching: false,
        isUninitialized: false,
        isSuccess: false,
        refetch: vi.fn(),
    })),
}))

describe('useDataSourceOptions', () => {
    const mockUseCurrentUser = vi.mocked(useCurrentUser)
    const mockUseRtkQuery = vi.mocked(useRtkQuery)

    const mockPrograms = [
        { id: '1', name: 'Program A', programType: 'WITH_REGISTRATION' },
        { id: '2', name: 'Program B', programType: 'WITHOUT_REGISTRATION' },
        { id: '3', name: 'Another Program', programType: 'WITH_REGISTRATION' },
        { id: '4', name: 'Fourth Program', programType: 'WITH_REGISTRATION' },
        { id: '5', name: 'Fifth Program', programType: 'WITHOUT_REGISTRATION' },
    ]

    const mockTrackedEntityTypes = [
        { id: '1', name: 'Entity Type A' },
        { id: '2', name: 'Entity Type B' },
    ]

    const mockData = {
        programs: { programs: mockPrograms },
        trackedEntityTypes: { trackedEntityTypes: mockTrackedEntityTypes },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset to default
        mockUseCurrentUser.mockReturnValue({
            name: 'Test User',
            settings: {
                displayNameProperty: 'displayName' as const,
                dbLocale: 'en',
                uiLocale: 'en',
                displayProperty: 'name',
            },
        })
        mockUseRtkQuery.mockReturnValue({
            isLoading: true,
            isError: false,
            error: undefined,
            data: undefined,
            currentData: undefined,
            isFetching: false,
            isUninitialized: false,
            isSuccess: false,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)
    })

    it('should return loading state initially', () => {
        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.isLoading).toBe(true)
        expect(result.current.isError).toBe(false)
        expect(result.current.programs).toEqual([])
        expect(result.current.trackedEntityTypes).toEqual([])
        expect(result.current.filterString).toBe('')
        expect(result.current.shouldShowFilter).toBe(false)
    })

    it('should return programs and tracked entity types', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: mockData,
            currentData: mockData,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.isLoading).toBe(false)
        expect(result.current.programs).toHaveLength(2)
        expect(result.current.trackedEntityTypes).toHaveLength(2) // Less than incrementer
        expect(result.current.hasMorePrograms).toBe(true)
        expect(result.current.hasMoreTrackedEntityTypes).toBe(false)
    })

    it('should show filter when total items exceed incrementer', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: mockData,
            currentData: mockData,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.shouldShowFilter).toBe(true)
    })

    it('should filter programs by name', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: mockData,
            currentData: mockData,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        act(() => {
            result.current.onFilterStringChange({ value: 'program a' })
        })

        expect(result.current.filterString).toBe('program a')
        expect(result.current.programs).toEqual([
            {
                id: '1',
                name: 'Program A',
                programType: 'WITH_REGISTRATION',
            },
        ])
    })

    it('should handle show more programs', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: mockData,
            currentData: mockData,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.programs).toHaveLength(2)
        expect(result.current.hasMorePrograms).toBe(true)

        act(() => {
            result.current.onShowMoreProgramsClick()
        })

        expect(result.current.programs).toHaveLength(4) // 2 + 2
        expect(result.current.hasMorePrograms).toBe(true)

        act(() => {
            result.current.onShowMoreProgramsClick()
        })

        expect(result.current.programs).toHaveLength(5) // 4 + 1 (remaining)
        expect(result.current.hasMorePrograms).toBe(false)
    })

    it('should handle show more tracked entity types', () => {
        // Add more tracked entity types to test
        const moreTrackedEntityTypes = [
            ...mockTrackedEntityTypes,
            { id: '3', name: 'Entity Type C' },
            { id: '4', name: 'Entity Type D' },
            { id: '5', name: 'Entity Type E' },
        ]
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: {
                ...mockData,
                trackedEntityTypes: {
                    trackedEntityTypes: moreTrackedEntityTypes,
                },
            },
            currentData: {
                ...mockData,
                trackedEntityTypes: {
                    trackedEntityTypes: moreTrackedEntityTypes,
                },
            },
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.trackedEntityTypes).toHaveLength(2)
        expect(result.current.hasMoreTrackedEntityTypes).toBe(true)

        act(() => {
            result.current.onShowMoreTrackedEntityTypesClick()
        })

        expect(result.current.trackedEntityTypes).toHaveLength(4)
        expect(result.current.hasMoreTrackedEntityTypes).toBe(true)

        act(() => {
            result.current.onShowMoreTrackedEntityTypesClick()
        })

        expect(result.current.trackedEntityTypes).toHaveLength(5) // 4 + 1 (remaining)
        expect(result.current.hasMoreTrackedEntityTypes).toBe(false)
    })

    it('should sort filtered results alphabetically', () => {
        const unsortedPrograms = [
            { id: '1', name: 'Z Program' },
            { id: '2', name: 'A Program' },
            { id: '3', name: 'M Program' },
        ]
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: {
                programs: { programs: unsortedPrograms },
                trackedEntityTypes: { trackedEntityTypes: [] },
            },
            currentData: {
                programs: { programs: unsortedPrograms },
                trackedEntityTypes: { trackedEntityTypes: [] },
            },
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        act(() => {
            result.current.onFilterStringChange({ value: 'program' })
        })

        expect(result.current.programs.map((p) => p.name)).toEqual([
            'A Program',
            'M Program',
        ])
    })

    it('should return error state', () => {
        const mockError = {
            type: 'network' as const,
            message: 'Network error',
        }
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: true,
            error: mockError,
            data: undefined,
            currentData: undefined,
            isFetching: false,
            isUninitialized: false,
            isSuccess: false,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.isError).toBe(true)
        expect(result.current.error).toBe(mockError)
        expect(result.current.programs).toEqual([])
        expect(result.current.trackedEntityTypes).toEqual([])
    })

    it('should use displayNameProperty from user settings', () => {
        mockUseCurrentUser.mockReturnValue({
            name: 'Test User',
            settings: {
                displayNameProperty: 'displayShortName' as const,
                dbLocale: 'en',
                uiLocale: 'en',
                displayProperty: 'name',
            },
        })

        renderHook(() => useDataSourceOptions(2))

        expect(mockUseRtkQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                programs: expect.objectContaining({
                    params: expect.objectContaining({
                        fields: expect.stringContaining(
                            'displayShortName~rename(name)'
                        ),
                    }),
                }),
                trackedEntityTypes: expect.objectContaining({
                    params: expect.objectContaining({
                        fields: expect.stringContaining(
                            'displayShortName~rename(name)'
                        ),
                    }),
                }),
            })
        )
    })

    it('should handle empty data', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: {
                programs: { programs: [] },
                trackedEntityTypes: { trackedEntityTypes: [] },
            },
            currentData: {
                programs: { programs: [] },
                trackedEntityTypes: { trackedEntityTypes: [] },
            },
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.programs).toEqual([])
        expect(result.current.trackedEntityTypes).toEqual([])
        expect(result.current.shouldShowFilter).toBe(false)
    })

    it('should handle undefined data', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: undefined,
            currentData: undefined,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        expect(result.current.programs).toEqual([])
        expect(result.current.trackedEntityTypes).toEqual([])
        expect(result.current.shouldShowFilter).toBe(false)
    })

    it('should handle filter with no matches', () => {
        mockUseRtkQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            error: undefined,
            data: mockData,
            currentData: mockData,
            isFetching: false,
            isUninitialized: false,
            isSuccess: true,
            refetch: vi.fn(),
        } as UseRtkQueryResult<unknown>)

        const { result } = renderHook(() => useDataSourceOptions(2))

        act(() => {
            result.current.onFilterStringChange({ value: 'nonexistent' })
        })

        expect(result.current.programs).toEqual([])
        expect(result.current.trackedEntityTypes).toEqual([])
    })
})
