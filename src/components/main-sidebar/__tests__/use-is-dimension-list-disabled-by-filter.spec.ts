import { act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useIsDimensionListDisabledByFilter } from '../use-is-dimension-list-disabled-by-filter'
import {
    dimensionSelectionSlice,
    setFilter,
} from '@store/dimensions-selection-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type { DimensionMetadataItem, SingleQuery } from '@types'

vi.mock('@components/main-sidebar/use-dimension-list', async () => {
    const actual = await vi.importActual(
        '@components/main-sidebar/use-dimension-list'
    )
    return {
        ...actual,
    }
})

describe('useIsDimensionListDisabledByFilter', () => {
    const baseQuery: SingleQuery = {
        resource: 'dataElements',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT', 'domainType:eq:TRACKER'],
        },
    }

    const createDimension = (
        id: string,
        dimensionType: string
    ): DimensionMetadataItem => ({
        id,
        name: `Dimension ${id}`,
        dimensionType: dimensionType as DimensionMetadataItem['dimensionType'],
    })

    it('returns false when filter matches baseQuery dimension type', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
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

        expect(result.current).toBe(false)
    })

    it('returns true when filter does not match baseQuery dimension type', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
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

        expect(result.current).toBe(true)
    })

    it('returns false when filter is null', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
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
                            filter: null,
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current).toBe(false)
    })

    it('returns false when initialDimensions contains item matching filter', async () => {
        const initialDimensions: DimensionMetadataItem[] = [
            createDimension('dim-1', 'PROGRAM_INDICATOR'),
            createDimension('dim-2', 'DATA_ELEMENT'),
        ]

        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery,
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
                            filter: 'PROGRAM_INDICATOR',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current).toBe(false)
    })

    it('returns true when filter does not match baseQuery or any initialDimensions', async () => {
        const initialDimensions: DimensionMetadataItem[] = [
            createDimension('dim-1', 'DATA_ELEMENT'),
            createDimension('dim-2', 'DATA_ELEMENT'),
        ]

        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery,
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
                            filter: 'PROGRAM_INDICATOR',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current).toBe(true)
    })

    it('returns true when initialDimensions is empty and filter does not match baseQuery', async () => {
        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery,
                    initialDimensions: [],
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

        expect(result.current).toBe(true)
    })

    it('returns true when no baseQuery and no initialDimensions provided', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useIsDimensionListDisabledByFilter({}),
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

        expect(result.current).toBe(true)
    })

    it('returns false when no baseQuery but initialDimensions match filter', async () => {
        const initialDimensions: DimensionMetadataItem[] = [
            createDimension('dim-1', 'DATA_ELEMENT'),
        ]

        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
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
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        expect(result.current).toBe(false)
    })

    it('recomputes when filter changes', async () => {
        const initialDimensions: DimensionMetadataItem[] = [
            createDimension('dim-1', 'DATA_ELEMENT'),
            createDimension('dim-2', 'PROGRAM_INDICATOR'),
        ]

        const { result, store } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery,
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
        expect(result.current).toBe(false)

        // Change to PROGRAM_INDICATOR (doesn't match baseQuery but matches initialDimensions)
        act(() => {
            store.dispatch(setFilter('PROGRAM_INDICATOR'))
        })

        expect(result.current).toBe(false)

        // Change to CATEGORY (doesn't match baseQuery or initialDimensions)
        act(() => {
            store.dispatch(setFilter('CATEGORY'))
        })

        expect(result.current).toBe(true)
    })

    it('handles baseQuery without dimension type filter', async () => {
        const baseQueryWithoutDimensionType: SingleQuery = {
            resource: 'programIndicators',
            params: {
                filter: ['program.id:eq:abc123'],
            },
        }

        const { result } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery: baseQueryWithoutDimensionType,
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

        // Should be enabled since baseQuery has no dimension type restriction
        expect(result.current).toBe(false)
    })

    it('memoizes result and does not recompute unnecessarily', async () => {
        const initialDimensions: DimensionMetadataItem[] = [
            createDimension('dim-1', 'DATA_ELEMENT'),
        ]

        const { result, rerender } = await renderHookWithAppWrapper(
            () =>
                useIsDimensionListDisabledByFilter({
                    baseQuery,
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
                            filter: 'DATA_ELEMENT',
                            dimensionCardCollapseStates: {},
                            dimensionListLoadingStates: {},
                            multiSelectedDimensionIds: [],
                        },
                    },
                },
            }
        )

        const firstResult = result.current
        expect(firstResult).toBe(false)

        // Rerender without changing dependencies
        rerender()

        // Should return the same reference (memoized)
        expect(result.current).toBe(firstResult)
    })
})
