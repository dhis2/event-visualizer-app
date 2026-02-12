import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@api/api'
import { type EngineError, parseEngineError } from '@api/parse-engine-error'
import { useAppDispatch, useAppSelector } from '@hooks'
import { isDimensionMetadataItem } from '@modules/metadata'
import { isObject, isPopulatedString } from '@modules/validation'
import {
    addDimensionListLoadingState,
    getDimensionListError,
    getFilter,
    getSearchTerm,
    isDimensionListLoading,
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
    dimensionListKey: DimensionListKey
    initialDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
}

export type UseDimensionListReturn = {
    dimensions: DimensionMetadataItem[]
    isLoading: boolean
    error?: EngineError
    hasMore: boolean
    loadMore: () => void
}

export type ResponseData = Record<string, DimensionMetadataItem[]> & {
    pager: {
        page: number
        pageCount: number
        pageSize: number
        total: number
    }
}

export const transformResponseData = (
    data: ResponseData
): {
    dimensions: DimensionMetadataItem[]
    hasMore: boolean
} => {
    const dimensionsKey = Object.keys(data).find((key) => key !== 'pager')

    if (
        !(
            isObject(data) &&
            'pager' in data &&
            Object.keys(data).length === 2 &&
            typeof data.pager.page === 'number' &&
            typeof data.pager.pageCount === 'number' &&
            typeof dimensionsKey === 'string' &&
            Array.isArray(data[dimensionsKey])
        )
    ) {
        throw new Error('Invalid response data')
    }

    const dimensions = data[dimensionsKey]
    const hasMore = data.pager.page < data.pager.pageCount

    if (dimensions.length > 0 && !isDimensionMetadataItem(dimensions[0])) {
        throw new Error(
            'Dimensions array item is not a valid dimension metadata item'
        )
    }

    return { dimensions, hasMore }
}

type SingleQueryWithFilterParam = Omit<SingleQuery, 'params'> & {
    params: Omit<SingleQuery['params'], 'filter' | 'page'> & {
        filter: string[]
        page: number
    }
}

const FILTER_PARAM_SEARCH_TERM = 'displayName:ilike:'
export const FILTER_PARAM_DIMENSION_TYPE = 'dimensionType:eq:'
const DEFAULT_INITIAL_DIMENSIONS = []

const updateQuerySearchFilter = (
    query: SingleQueryWithFilterParam | null,
    searchTerm: string
): SingleQueryWithFilterParam | null => {
    if (!query) {
        return null
    }

    if (!searchTerm) {
        // Remove search filter param if no searchTerm is provided
        query.params.filter = query.params.filter.filter(
            (str) => !str.startsWith(FILTER_PARAM_SEARCH_TERM)
        )
    } else {
        let hasExistingFilter = false
        const newSearchFilterParam = `${FILTER_PARAM_SEARCH_TERM}${searchTerm}`

        for (let index = 0; index < query.params.filter.length; index++) {
            if (
                query.params.filter[index].startsWith(FILTER_PARAM_SEARCH_TERM)
            ) {
                // Replace existing filter if one is found
                hasExistingFilter = true
                query.params.filter[index] = newSearchFilterParam
            }
        }
        if (!hasExistingFilter) {
            // Add filter if none was present
            query.params.filter.push(newSearchFilterParam)
        }
    }
    return query
}

const normalizeBaseQuery = (
    baseQuery: SingleQuery | undefined
): SingleQueryWithFilterParam | null => {
    if (!baseQuery) {
        return null
    }

    const query = { ...baseQuery }

    if (!query.params) {
        query.params = {}
    }
    if (!query.params.filter) {
        query.params.filter = []
    }
    if (typeof query.params.filter === 'string') {
        query.params.filter = query.params.filter.split(',')
    }

    query.params.page = 1

    if (
        !Array.isArray(query.params.filter) ||
        query.params.filter.some((str) => !isPopulatedString(str))
    ) {
        throw new Error('Invalid filter query params')
    }

    return query as SingleQueryWithFilterParam
}
type UseMutableQueryOptions = {
    baseQuery: UseDimensionListOptions['baseQuery']
    searchTerm: string
    filter: DataSourceFilter | null
}
type UseMutableQueryResult = {
    getQuery: () => SingleQueryWithFilterParam | null
    updateFilter: (newFilter: DataSourceFilter | null) => void
    updateSearchTerm: (newSearchTerm: string) => void
    incrementPage: () => void
}
const useMutableQuery = ({
    baseQuery,
    searchTerm,
    filter,
}: UseMutableQueryOptions): UseMutableQueryResult => {
    const baseQueryRef = useRef(baseQuery)
    const filterRef = useRef(filter)
    const queryRef = useRef<SingleQueryWithFilterParam | null>(
        updateQuerySearchFilter(normalizeBaseQuery(baseQuery), searchTerm)
    )

    useEffect(() => {
        if (baseQuery !== baseQueryRef.current) {
            throw new Error('Ensure baseQuery is stable')
        }
    }, [baseQuery])

    return useMemo<UseMutableQueryResult>(
        () => ({
            getQuery: () => {
                if (!queryRef.current) {
                    return null
                }
                const filterParamDimensionType = queryRef.current.params.filter
                    .find((str) => str.startsWith(FILTER_PARAM_DIMENSION_TYPE))
                    ?.replace(FILTER_PARAM_DIMENSION_TYPE, '') as
                    | DimensionType
                    | undefined
                const shouldFetch =
                    !filterParamDimensionType ||
                    filterParamDimensionType === filterRef.current

                if (!shouldFetch) {
                    return null
                } else {
                    return queryRef.current
                }
            },

            updateFilter: (newFilter: DataSourceFilter | null) => {
                filterRef.current = newFilter
            },

            updateSearchTerm: (newSearchTerm: string) => {
                queryRef.current = updateQuerySearchFilter(
                    queryRef.current,
                    newSearchTerm
                )
                if (queryRef.current) {
                    queryRef.current.params.page = 1
                }
            },

            incrementPage: () => {
                if (queryRef.current) {
                    queryRef.current.params.page =
                        queryRef.current.params.page + 1
                }
            },
        }),
        []
    )
}
export const useDimensionList = ({
    dimensionListKey,
    initialDimensions = DEFAULT_INITIAL_DIMENSIONS,
    baseQuery,
}: UseDimensionListOptions): UseDimensionListReturn => {
    const dispatch = useAppDispatch()
    const searchTerm = useAppSelector(getSearchTerm)
    const filter = useAppSelector(getFilter)
    const isLoading = useAppSelector((state) =>
        isDimensionListLoading(state, dimensionListKey)
    )
    const error = useAppSelector((state) =>
        getDimensionListError(state, dimensionListKey)
    )
    const { getQuery, incrementPage, updateSearchTerm, updateFilter } =
        useMutableQuery({ baseQuery, searchTerm, filter })
    const [fetchedDimensions, setFetchedDimensions] = useState<
        DimensionMetadataItem[]
    >([])
    const [hasMore, setHasMore] = useState(() => !!getQuery())

    const fetchDimensions = useCallback(async () => {
        const query = getQuery()

        if (!query) {
            return
        }

        dispatch(setDimensionListLoadStart(dimensionListKey))

        try {
            const responseData = (await dispatch(
                api.endpoints.query.initiate(query)
            ).unwrap()) as ResponseData

            const { dimensions, hasMore } = transformResponseData(responseData)

            if (query.params.page === 1) {
                setFetchedDimensions(dimensions)
            } else {
                setFetchedDimensions((prev) => [...prev, ...dimensions])
            }
            setHasMore(hasMore)
            dispatch(setDimensionListLoadSuccess(dimensionListKey))
        } catch (error) {
            const engineError = parseEngineError(error)
            dispatch(
                setDimensionListLoadError({
                    id: dimensionListKey,
                    error: engineError,
                })
            )
        }
    }, [dispatch, dimensionListKey, getQuery])

    // TODO: Should we keep this? It should just work
    const stabilityCheckRef = useRef({
        dimensionListKey,
        initialDimensions,
        baseQuery,
        fetchDimensions,
        getQuery,
        incrementPage,
        updateSearchTerm,
        updateFilter,
    })

    useEffect(() => {
        if (
            dimensionListKey !== stabilityCheckRef.current.dimensionListKey ||
            initialDimensions !== stabilityCheckRef.current.initialDimensions ||
            baseQuery !== stabilityCheckRef.current.baseQuery ||
            fetchDimensions !== stabilityCheckRef.current.fetchDimensions ||
            getQuery !== stabilityCheckRef.current.getQuery ||
            incrementPage !== stabilityCheckRef.current.incrementPage ||
            updateSearchTerm !== stabilityCheckRef.current.updateSearchTerm ||
            updateFilter !== stabilityCheckRef.current.updateFilter
        ) {
            throw new Error('Found an instable property')
        }
    }, [
        dimensionListKey,
        initialDimensions,
        baseQuery,
        fetchDimensions,
        getQuery,
        incrementPage,
        updateSearchTerm,
        updateFilter,
    ])
    // END OF STABILITY CHECK CODE

    const loadMore = useCallback(() => {
        if (!!getQuery() && hasMore && !isLoading) {
            incrementPage()
            fetchDimensions()
        }
    }, [hasMore, isLoading, incrementPage, fetchDimensions, getQuery])

    const dimensions = useMemo(() => {
        /* Initial items need to be filtered, but not sorted.
         * Fetched items are sorted and filtered server side. */
        const lowerSearchTerm = searchTerm.toLocaleLowerCase()
        const hasQuery = !!getQuery()

        return initialDimensions
            .filter((dimension) => {
                const searchTermMatch =
                    !lowerSearchTerm ||
                    dimension.name.toLocaleLowerCase().includes(lowerSearchTerm)
                const filterMatch =
                    !filter || dimension.dimensionType === filter
                return searchTermMatch && filterMatch
            })
            .concat(hasQuery ? fetchedDimensions : [])
    }, [initialDimensions, fetchedDimensions, searchTerm, filter, getQuery])

    useEffect(() => {
        dispatch(addDimensionListLoadingState(dimensionListKey))

        return () => {
            dispatch(removeDimensionListLoadingState(dimensionListKey))
        }
    }, [dispatch, dimensionListKey])

    useEffect(() => {
        updateFilter(filter)
    }, [filter, updateFilter])

    useEffect(() => {
        updateSearchTerm(searchTerm)
        fetchDimensions()
    }, [searchTerm, updateSearchTerm, fetchDimensions])

    return useMemo(
        () => ({
            dimensions,
            isLoading,
            error,
            hasMore: !!getQuery() && hasMore,
            loadMore,
        }),
        [dimensions, isLoading, error, hasMore, loadMore, getQuery]
    )
}
