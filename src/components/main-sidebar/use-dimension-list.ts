import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useDebounceValue, useIsMounted } from 'usehooks-ts'
import { api } from '@api/api'
import { type EngineError, parseEngineError } from '@api/parse-engine-error'
import { useAppDispatch, useAppSelector, useStableCallback } from '@hooks'
import { isDimensionMetadataItem } from '@modules/metadata'
import { isObject, isPopulatedString } from '@modules/validation'
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
    DataSourceFilter,
    DimensionListKey,
    DimensionMetadataItem,
    DimensionType,
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

export type Transformer = (data: unknown) => {
    dimensions: DimensionMetadataItem[]
    nextPage: number | null
}

type SingleQueryWithFilterParam = Omit<SingleQuery, 'params'> & {
    params: Omit<SingleQuery['params'], 'filter' | 'page'> & {
        filter: string[]
        page: number
    }
}

// State Machine Types
type DimensionListStatus =
    | 'uninitialized' // Never attempted to fetch
    | 'initial-loading' // First fetch in progress
    | 'idle' // Ready for actions (initial load complete)
    | 'searching' // Search operation in progress
    | 'loading-more' // Loading more data (pagination)
    | 'error' // Error state

type DimensionListState = {
    status: DimensionListStatus
    dimensions: DimensionMetadataItem[]
    nextPage: number | null
    error?: EngineError
    hasNoData: boolean // True only when page 1, no search term, no data, no fixed dimensions
}

type DimensionListAction =
    | { type: 'INITIAL_LOAD_START' }
    | {
          type: 'INITIAL_LOAD_SUCCESS'
          payload: {
              dimensions: DimensionMetadataItem[]
              nextPage: number | null
              searchTerm: string
              hasFixedDimensions: boolean
          }
      }
    | { type: 'SEARCH_START' }
    | {
          type: 'SEARCH_SUCCESS'
          payload: {
              dimensions: DimensionMetadataItem[]
              nextPage: number | null
              searchTerm: string
              hasFixedDimensions: boolean
          }
      }
    | { type: 'LOAD_MORE_START' }
    | {
          type: 'LOAD_MORE_SUCCESS'
          payload: { dimensions: DimensionMetadataItem[]; nextPage: number | null }
      }
    | { type: 'ERROR'; payload: EngineError }
    | { type: 'RESET' }

const FILTER_PARAM_SEARCH_TERM = 'displayName:ilike:'
const FILTER_PARAM_DIMENSION_TYPE = 'dimensionType:eq:'
const DEFAULT_FIXED_DIMENSIONS = []

export const defaultTransformer: Transformer = (data) => {
    if (!isObject(data) || !('pager' in data) || !('dimensions' in data)) {
        throw new Error('Invalid response data')
    }

    const pager = data.pager
    const dimensions = data.dimensions

    if (
        !isObject(pager) ||
        typeof pager.page !== 'number' ||
        typeof pager.pageCount !== 'number' ||
        typeof pager.pageSize !== 'number' ||
        typeof pager.total !== 'number'
    ) {
        throw new Error('Invalid pager structure')
    }

    if (!Array.isArray(dimensions)) {
        throw new TypeError('Dimensions is not an array')
    }

    if (dimensions.length > 0 && !isDimensionMetadataItem(dimensions[0])) {
        throw new Error('Invalid dimension metadata items')
    }

    const nextPage = pager.page < pager.pageCount ? pager.page + 1 : null
    return { dimensions, nextPage }
}

export const getFilterParamsFromBaseQuery = (
    baseQuery: SingleQuery | undefined
): string[] => {
    if (!(isObject(baseQuery?.params) && 'filter' in baseQuery.params)) {
        return []
    }

    if (typeof baseQuery.params.filter === 'string') {
        return baseQuery.params.filter
            .split(',')
            .filter((str) => str.length > 0)
    } else if (
        Array.isArray(baseQuery.params.filter) &&
        baseQuery.params.filter.every((str) => isPopulatedString(str))
    ) {
        return [...baseQuery.params.filter]
    } else {
        throw new Error('Invalid filter query params')
    }
}

export const buildQuery = (
    baseQuery: SingleQuery,
    searchTerm: string,
    page: number
): SingleQueryWithFilterParam => {
    const query = { ...baseQuery }
    const params = {
        ...query.params,
        filter: getFilterParamsFromBaseQuery(query),
        page,
    }

    if (searchTerm) {
        params.filter.push(`${FILTER_PARAM_SEARCH_TERM}${searchTerm}`)
    }

    return {
        ...query,
        params,
    }
}

export const isFetchEnabledByFilter = (
    baseQuery: SingleQuery,
    filter: DataSourceFilter | null
): boolean => {
    if (filter) {
        const dimensionTypeFilter = getFilterParamsFromBaseQuery(
            baseQuery
        ).find((str) => str.startsWith(FILTER_PARAM_DIMENSION_TYPE))

        if (dimensionTypeFilter) {
            const dimensionType = dimensionTypeFilter.replace(
                FILTER_PARAM_DIMENSION_TYPE,
                ''
            ) as DimensionType
            // Fetch only when query filter matches enabled filter
            return dimensionType === filter
        }
        // No dimension type filter in query, fetch regardless of filter
        return true
    }
    return true
}

export const filterDimensions = (
    dimensions: DimensionMetadataItem[],
    searchTerm: string,
    filter: DataSourceFilter | null
): DimensionMetadataItem[] => {
    const lowerSearchTerm = searchTerm.toLocaleLowerCase()

    return dimensions.filter((dimension) => {
        const searchTermMatch =
            !lowerSearchTerm ||
            dimension.name.toLocaleLowerCase().includes(lowerSearchTerm)
        const filterMatch = !filter || dimension.dimensionType === filter
        return searchTermMatch && filterMatch
    })
}

export const computeIsDisabledByFilter = (
    baseQuery: SingleQuery | undefined,
    filter: DataSourceFilter | null,
    fixedDimensionTypes: DimensionType[] = []
): boolean => {
    const hasMatchingFixedDimensionType =
        filter !== null &&
        Array.isArray(fixedDimensionTypes) &&
        fixedDimensionTypes.includes(filter)

    if (baseQuery) {
        // List with query: disabled if fetch not enabled AND no matching fixed dimension
        const isFetchEnabled = isFetchEnabledByFilter(baseQuery, filter)
        return !isFetchEnabled && !hasMatchingFixedDimensionType
    }
    // Fixed-only list: disabled only if filter doesn't match any fixed dimension
    return filter !== null && !hasMatchingFixedDimensionType
}

// State Machine Reducer
const initialDimensionListState: DimensionListState = {
    status: 'uninitialized',
    dimensions: [],
    nextPage: null,
    error: undefined,
    hasNoData: false,
}

const dimensionListReducer = (
    state: DimensionListState,
    action: DimensionListAction
): DimensionListState => {
    switch (action.type) {
        case 'INITIAL_LOAD_START':
            return {
                ...state,
                status: 'initial-loading',
                error: undefined,
            }

        case 'INITIAL_LOAD_SUCCESS': {
            // hasNoData is true ONLY when:
            // - page 1 (initial load)
            // - no search term
            // - no dimensions returned
            // - no fixed dimensions
            const hasNoData =
                !action.payload.searchTerm &&
                action.payload.dimensions.length === 0 &&
                !action.payload.hasFixedDimensions

            return {
                status: 'idle',
                dimensions: action.payload.dimensions,
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData,
            }
        }

        case 'SEARCH_START':
            return {
                ...state,
                status: 'searching',
                // Clear error when starting a new search
                error: undefined,
            }

        case 'SEARCH_SUCCESS': {
            // Update hasNoData ONLY if this is a search with no search term (i.e., clearing search)
            // Otherwise, keep the existing hasNoData value
            const hasNoData = !action.payload.searchTerm
                ? action.payload.dimensions.length === 0 &&
                  !action.payload.hasFixedDimensions
                : state.hasNoData

            return {
                status: 'idle',
                dimensions: action.payload.dimensions,
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData,
            }
        }

        case 'LOAD_MORE_START':
            return {
                ...state,
                status: 'loading-more',
                error: undefined,
            }

        case 'LOAD_MORE_SUCCESS':
            return {
                status: 'idle',
                dimensions: [...state.dimensions, ...action.payload.dimensions],
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData: state.hasNoData, // Keep existing hasNoData
            }

        case 'ERROR':
            return {
                ...state,
                status: 'error',
                error: action.payload,
            }

        case 'RESET':
            return initialDimensionListState

        default:
            return state
    }
}

export const useDimensionList = ({
    dimensionListKey,
    fixedDimensions = DEFAULT_FIXED_DIMENSIONS,
    baseQuery,
    transformer = defaultTransformer,
}: UseDimensionListOptions): UseDimensionListResult => {
    // Redux for shared state
    const appDispatch = useAppDispatch()
    const searchTerm = useAppSelector(getSearchTerm)
    const filter = useAppSelector(getFilter)

    // Local state machine
    const [state, localDispatch] = useReducer(
        dimensionListReducer,
        initialDimensionListState
    )

    // Mount tracking for cleanup
    const isMounted = useIsMounted()

    // Track previous searchTerm to detect actual changes
    const prevSearchTermRef = useRef<string>(searchTerm)

    // Track the search term used for current fetched data
    const [resolvedSearchTerm, setResolvedSearchTerm] = useState<string>('')

    // For fixed-only lists (no baseQuery), sync resolvedSearchTerm with searchTerm
    useEffect(() => {
        if (!baseQuery) {
            setResolvedSearchTerm(searchTerm)
        }
    }, [searchTerm, baseQuery])

    // Debounced UI state for isLoadingMore
    const isLoadingMoreRaw = state.status === 'loading-more'
    const [debouncedIsLoadingMore] = useDebounceValue(isLoadingMoreRaw, 300)

    // Stable fetch function with access to latest values
    const performFetch = useStableCallback(
        async (mode: 'initial' | 'search' | 'load-more', page: number) => {
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
        }
    )

    // Register loading state in Redux on mount
    useEffect(() => {
        if (dimensionListKey) {
            appDispatch(addDimensionListLoadingState(dimensionListKey))

            return () => {
                appDispatch(removeDimensionListLoadingState(dimensionListKey))
            }
        }
    }, [appDispatch, dimensionListKey])

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

    // Initial fetch
    // Note: performFetch is stable via useStableCallback with access to fresh values.
    // baseQuery, filter, and fixedDimensions.length are in the condition but not deps
    // because components are keyed by dataSource ID - when these change, component remounts.
    useEffect(() => {
        if (
            state.status === 'uninitialized' &&
            dimensionListKey &&
            baseQuery &&
            isFetchEnabledByFilter(baseQuery, filter)
        ) {
            localDispatch({ type: 'INITIAL_LOAD_START' })

            performFetch('initial', 1).then(
                (result) => {
                    if (result) {
                        localDispatch({
                            type: 'INITIAL_LOAD_SUCCESS',
                            payload: {
                                ...result,
                                searchTerm,
                                hasFixedDimensions: fixedDimensions.length > 0,
                            },
                        })
                    }
                },
                (error) => {
                    localDispatch({
                        type: 'ERROR',
                        payload: parseEngineError(error),
                    })
                }
            )
        } else if (
            state.status === 'uninitialized' &&
            (!baseQuery || !isFetchEnabledByFilter(baseQuery, filter))
        ) {
            // No fetch needed, transition directly to idle
            localDispatch({
                type: 'INITIAL_LOAD_SUCCESS',
                payload: {
                    dimensions: [],
                    nextPage: null,
                    searchTerm,
                    hasFixedDimensions: fixedDimensions.length > 0,
                },
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.status, dimensionListKey, performFetch])

    // Search on searchTerm change
    useEffect(() => {
        // Check if searchTerm actually changed
        const hasSearchTermChanged = prevSearchTermRef.current !== searchTerm
        prevSearchTermRef.current = searchTerm

        // Only search after initial load, if baseQuery exists, and searchTerm changed
        if (
            state.status !== 'uninitialized' &&
            baseQuery &&
            hasSearchTermChanged
        ) {
            localDispatch({ type: 'SEARCH_START' })

            performFetch('search', 1).then(
                (result) => {
                    // If result is undefined (fetch was skipped), still transition to success state
                    localDispatch({
                        type: 'SEARCH_SUCCESS',
                        payload: {
                            dimensions: result?.dimensions || [],
                            nextPage: result?.nextPage || null,
                            searchTerm,
                            hasFixedDimensions: fixedDimensions.length > 0,
                        },
                    })
                },
                (error) => {
                    localDispatch({
                        type: 'ERROR',
                        payload: parseEngineError(error),
                    })
                }
            )
        }
        // Note: performFetch is stable via useStableCallback with access to fresh values.
        // fixedDimensions.length is in the condition but not deps because components are
        // keyed by dataSource ID - when it changes, component remounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, state.status, performFetch])

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

    // loadMore callback
    const loadMore = useCallback(() => {
        if (state.nextPage !== null && state.status === 'idle') {
            localDispatch({ type: 'LOAD_MORE_START' })

            performFetch('load-more', state.nextPage).then(
                (result) => {
                    if (result) {
                        localDispatch({
                            type: 'LOAD_MORE_SUCCESS',
                            payload: result,
                        })
                    }
                },
                (error) => {
                    localDispatch({
                        type: 'ERROR',
                        payload: parseEngineError(error),
                    })
                }
            )
        }
    }, [state.nextPage, state.status, performFetch])

    // Return the hook result
    return {
        dimensions,
        isLoading: state.status === 'initial-loading',
        isLoadingMore: debouncedIsLoadingMore,
        error: state.error,
        hasMore,
        hasNoData: state.hasNoData,
        loadMore,
        isDisabledByFilter,
    }
}
