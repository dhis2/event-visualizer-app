import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounceValue, useIsMounted } from 'usehooks-ts'
import { defaultTransformer, type Transformer } from './default-transformer'
import {
    computeIsDisabledByFilter,
    filterDimensions,
    isFetchEnabledByFilter,
} from './filter-helpers'
import { buildQuery } from './query-helpers'
import { useDimensionListState } from './use-dimension-list-state'
import { api } from '@api/api'
import { parseEngineError, type EngineError } from '@api/parse-engine-error'
import { useAppDispatch, useAppSelector, useStableCallback } from '@hooks'
import {
    addDimensionListLoadingState,
    getFilter,
    getSearchTerm,
    removeDimensionListLoadingState,
    setDimensionListLoadError,
    setDimensionListLoadStart,
    setDimensionListLoadSuccess,
} from '@store/dimensions-selection-slice'
import type {
    DimensionListKey,
    DimensionMetadataItem,
    SingleQuery,
} from '@types'

export type UseDimensionListOptions = {
    dimensionListKey?: DimensionListKey
    fixedDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
    transformer?: Transformer
}

export type UseDimensionListResult = {
    dimensions: DimensionMetadataItem[]
    isLoading: boolean
    isLoadingMore: boolean
    error?: EngineError
    hasMore: boolean
    hasNoData: boolean
    loadMore: () => void
    isDisabledByFilter: boolean
}

const DEFAULT_FIXED_DIMENSIONS = []

export const useDimensionList = ({
    dimensionListKey,
    fixedDimensions = DEFAULT_FIXED_DIMENSIONS,
    baseQuery,
    transformer = defaultTransformer,
}: UseDimensionListOptions): UseDimensionListResult => {
    const appDispatch = useAppDispatch()
    const searchTerm = useAppSelector(getSearchTerm)
    const filter = useAppSelector(getFilter)
    const {
        state,
        getState,
        onInitialLoadStart,
        onInitialLoadSuccess,
        onSearchStart,
        onSearchSuccess,
        onLoadMoreStart,
        onLoadMoreSuccess,
        onError,
    } = useDimensionListState()
    const isMounted = useIsMounted()
    // Track the search term used for current fetched data
    const [resolvedSearchTerm, setResolvedSearchTerm] = useState<string>('')
    const [debouncedIsLoadingMore] = useDebounceValue(
        state.status === 'loading-more',
        300
    )

    // Stable fetch function with access to latest values
    const performFetch = useStableCallback(async (page: number) => {
        if (!dimensionListKey || !baseQuery) {
            return
        }

        if (!isFetchEnabledByFilter(baseQuery, filter)) {
            return
        }

        try {
            const rawResponseData = await appDispatch(
                api.endpoints.query.initiate(
                    buildQuery(baseQuery, searchTerm, page)
                )
            ).unwrap()

            // Check if still mounted
            if (!isMounted()) {
                return
            }

            const { dimensions, nextPage } = transformer(rawResponseData)

            // Update resolved search term to match the fetch
            setResolvedSearchTerm(searchTerm)

            return { dimensions, nextPage }
        } catch (error) {
            if (!isMounted()) {
                return
            }
            throw error
        }
    })

    // ============================================================
    // EFFECTS (grouped together)
    // ============================================================

    // Register loading state in Redux on mount
    useEffect(() => {
        if (dimensionListKey) {
            appDispatch(addDimensionListLoadingState(dimensionListKey))

            return () => {
                appDispatch(removeDimensionListLoadingState(dimensionListKey))
            }
        }
    }, [appDispatch, dimensionListKey])

    // For fixed-only lists (no baseQuery), sync resolvedSearchTerm with searchTerm
    useEffect(() => {
        if (!baseQuery) {
            setResolvedSearchTerm(searchTerm)
        }
    }, [searchTerm, baseQuery])

    // Sync local state to Redux
    useEffect(() => {
        if (!dimensionListKey) {
            return
        }

        const isLoading =
            state.status === 'initial-loading' ||
            state.status === 'searching' ||
            state.status === 'loading-more'

        if (isLoading) {
            appDispatch(setDimensionListLoadStart(dimensionListKey))
        } else if (state.status === 'error' && state.error) {
            appDispatch(
                setDimensionListLoadError({
                    id: dimensionListKey,
                    error: state.error,
                })
            )
        } else if (state.status === 'idle') {
            appDispatch(setDimensionListLoadSuccess(dimensionListKey))
        }
    }, [state.status, state.error, dimensionListKey, appDispatch])

    // Initial load effect - runs once on mount
    useEffect(() => {
        // Read non-reactive status via getState()
        const { status } = getState()

        // Only run for initial load
        if (status !== 'uninitialized') {
            return
        }

        // Check if we should fetch
        const shouldFetch =
            dimensionListKey &&
            baseQuery &&
            isFetchEnabledByFilter(baseQuery, filter)

        if (shouldFetch) {
            onInitialLoadStart()

            performFetch(1).then(
                (result) => {
                    // Handle fetch completion (result may be undefined if fetch was skipped)
                    onInitialLoadSuccess({
                        dimensions: result?.dimensions || [],
                        nextPage: result?.nextPage || null,
                        searchTerm,
                        hasFixedDimensions: fixedDimensions.length > 0,
                    })
                },
                (error) => {
                    onError(parseEngineError(error))
                }
            )
        } else {
            // No fetch needed, but transition from uninitialized to idle
            onInitialLoadSuccess({
                dimensions: [],
                nextPage: null,
                searchTerm,
                hasFixedDimensions: fixedDimensions.length > 0,
            })
        }
        // Run only once on mount - using getState() to avoid status as dependency
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Search effect - runs when searchTerm changes
    useEffect(() => {
        // Read non-reactive status via getState()
        const { status } = getState()

        // Only search when idle or error (not during initial load or loading states)
        // Allow error -> searching transition for recovery
        if (status !== 'idle' && status !== 'error') {
            return
        }

        // Check if we should fetch
        // Read from closure - these don't change during component lifetime
        const shouldFetch =
            dimensionListKey &&
            baseQuery &&
            isFetchEnabledByFilter(baseQuery, filter)

        if (shouldFetch) {
            onSearchStart()

            performFetch(1).then(
                (result) => {
                    // Handle fetch completion (result may be undefined if fetch was skipped)
                    onSearchSuccess({
                        dimensions: result?.dimensions || [],
                        nextPage: result?.nextPage || null,
                        searchTerm,
                        hasFixedDimensions: fixedDimensions.length > 0,
                    })
                },
                (error) => {
                    onError(parseEngineError(error))
                }
            )
        } else {
            // No fetch needed
            onSearchSuccess({
                dimensions: [],
                nextPage: null,
                searchTerm,
                hasFixedDimensions: fixedDimensions.length > 0,
            })
        }
        // NOTE: dimensionListKey, baseQuery, filter, fixedDimensions intentionally NOT dependencies
        // They don't change during component lifetime (component is keyed by dataSource ID)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchTerm, // PRIMARY reactive dependency - only re-run when search term changes
        getState,
        performFetch,
        onSearchStart,
        onSearchSuccess,
        onError,
    ])

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    // Combine and filter dimensions
    const dimensions = useMemo(() => {
        const filteredInitial = filterDimensions(
            fixedDimensions,
            resolvedSearchTerm,
            filter
        )
        // Fetched dimensions are filtered server-side but need client-side filter
        const filteredFetched = filterDimensions(state.dimensions, '', filter)
        return [...filteredInitial, ...filteredFetched]
    }, [fixedDimensions, state.dimensions, resolvedSearchTerm, filter])

    // Compute isDisabledByFilter
    const isDisabledByFilter = useMemo(() => {
        const fixedDimensionTypes = fixedDimensions.map((d) => d.dimensionType)
        return computeIsDisabledByFilter(baseQuery, filter, fixedDimensionTypes)
    }, [baseQuery, filter, fixedDimensions])

    // Compute hasMore
    const hasMore = useMemo(
        () =>
            Boolean(
                state.nextPage !== null &&
                    baseQuery &&
                    isFetchEnabledByFilter(baseQuery, filter)
            ),
        [state.nextPage, baseQuery, filter]
    )

    // ============================================================
    // CALLBACKS
    // ============================================================

    // loadMore callback
    const loadMore = useCallback(() => {
        const { nextPage, status } = getState()
        if (nextPage !== null && status === 'idle') {
            onLoadMoreStart()

            performFetch(nextPage).then(
                (result) => {
                    if (result) {
                        onLoadMoreSuccess(result)
                    }
                },
                (error) => {
                    onError(parseEngineError(error))
                }
            )
        }
    }, [getState, performFetch, onLoadMoreStart, onLoadMoreSuccess, onError])

    // ============================================================
    // RETURN
    // ============================================================

    return {
        dimensions,
        isLoading:
            state.status === 'initial-loading' || state.status === 'searching',
        isLoadingMore: debouncedIsLoadingMore,
        error: state.error,
        hasMore,
        hasNoData: state.hasNoData,
        loadMore,
        isDisabledByFilter,
    }
}
