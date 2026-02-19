import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@api/api'
import { type EngineError, parseEngineError } from '@api/parse-engine-error'
import { useEffectEvent, useAppDispatch, useAppSelector } from '@hooks'
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
    dimensionListKey?: DimensionListKey
    fixedDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
    transformer?: Transformer
}

export type UseDimensionListResult = {
    dimensions: DimensionMetadataItem[]
    isLoading: boolean
    isFetching: boolean
    isSearching: boolean
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

// @deprecated - Use Transformer type instead
export type ResponseData = Record<string, DimensionMetadataItem[]> & {
    pager: {
        page: number
        pageCount: number
        pageSize: number
        total: number
    }
}

type SingleQueryWithFilterParam = Omit<SingleQuery, 'params'> & {
    params: Omit<SingleQuery['params'], 'filter' | 'page'> & {
        filter: string[]
        page: number
    }
}

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
        throw new Error('Dimensions is not an array')
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
    if (!filter) {
        return true
    } else {
        const dimensionTypeFilter = getFilterParamsFromBaseQuery(
            baseQuery
        ).find((str) => str.startsWith(FILTER_PARAM_DIMENSION_TYPE))

        if (!dimensionTypeFilter) {
            // No dimension type filter in query, fetch regardless of filter
            return true
        } else {
            const dimensionType = dimensionTypeFilter.replace(
                FILTER_PARAM_DIMENSION_TYPE,
                ''
            ) as DimensionType
            // Fetch only when query filter matches enabled filter
            return dimensionType === filter
        }
    }
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
        Array.isArray(fixedDimensionTypes) &&
        fixedDimensionTypes.some((dimensionType) => dimensionType === filter)

    if (!baseQuery) {
        // Fixed-only list: disabled only if filter doesn't match any fixed dimension
        return filter !== null && !hasMatchingFixedDimensionType
    } else {
        // List with query: disabled if fetch not enabled AND no matching fixed dimension
        const isFetchEnabled = isFetchEnabledByFilter(baseQuery, filter)
        return !isFetchEnabled && !hasMatchingFixedDimensionType
    }
}

export const useDimensionList = ({
    dimensionListKey,
    fixedDimensions = DEFAULT_FIXED_DIMENSIONS,
    baseQuery,
    transformer = defaultTransformer,
}: UseDimensionListOptions): UseDimensionListResult => {
    const dispatch = useAppDispatch()
    const searchTerm = useAppSelector(getSearchTerm)
    const filter = useAppSelector(getFilter)
    const isFetching = useAppSelector((state) =>
        isDimensionListLoading(state, dimensionListKey)
    )
    const error = useAppSelector((state) =>
        getDimensionListError(state, dimensionListKey)
    )
    const [fetchedDimensions, setFetchedDimensions] = useState<
        DimensionMetadataItem[]
    >([])
    const [hasNoData, setHasNoData] = useState(false)
    const isInitalFetchSuccessRef = useRef(false)
    const [isSearching, setIsSearching] = useState(false)
    const [resolvedSearchTerm, setResolvedSearchTerm] = useState(searchTerm)
    const nextPageRef = useRef<number | null>(null)

    const fetchDimensions = useEffectEvent(async () => {
        if (
            !dimensionListKey ||
            !baseQuery ||
            nextPageRef.current === null ||
            !isFetchEnabledByFilter(baseQuery, filter)
        ) {
            setResolvedSearchTerm(searchTerm)
            return
        }

        dispatch(setDimensionListLoadStart(dimensionListKey))

        try {
            const rawResponseData = await dispatch(
                api.endpoints.query.initiate(
                    buildQuery(baseQuery, searchTerm, nextPageRef.current)
                )
            ).unwrap()

            const { dimensions, nextPage } = transformer(rawResponseData)

            isInitalFetchSuccessRef.current = true
            setResolvedSearchTerm(searchTerm)
            setIsSearching(false)

            if (nextPageRef.current === 1) {
                setFetchedDimensions(dimensions)
            } else {
                setFetchedDimensions((prev) => [...prev, ...dimensions])
            }

            if (!searchTerm && fixedDimensions.length === 0) {
                // We need to check if the data has a pager with total
                if (
                    isObject(rawResponseData) &&
                    'pager' in rawResponseData &&
                    isObject(rawResponseData.pager) &&
                    typeof rawResponseData.pager.total === 'number'
                ) {
                    setHasNoData(rawResponseData.pager.total === 0)
                }
            }
            nextPageRef.current = nextPage
            dispatch(setDimensionListLoadSuccess(dimensionListKey))
        } catch (error) {
            setResolvedSearchTerm(searchTerm)
            setIsSearching(false)
            const engineError = parseEngineError(error)
            dispatch(
                setDimensionListLoadError({
                    id: dimensionListKey,
                    error: engineError,
                })
            )
        }
    })

    const loadMore = useCallback(() => {
        if (nextPageRef.current && !isFetching) {
            fetchDimensions()
        }
    }, [isFetching, fetchDimensions])

    const dimensions = useMemo(() => {
        const filteredInitial = filterDimensions(
            fixedDimensions,
            resolvedSearchTerm,
            filter
        )
        // Fetched dimensions are filtered server side but we still need to
        // apply a filter based on the redux store filter
        const filteredFetched = filterDimensions(fetchedDimensions, '', filter)
        return [...filteredInitial, ...filteredFetched]
    }, [fixedDimensions, fetchedDimensions, resolvedSearchTerm, filter])

    const isDisabledByFilter = useMemo(() => {
        const fixedDimensionTypes = fixedDimensions.map(
            (dimension) => dimension.dimensionType
        )
        return computeIsDisabledByFilter(baseQuery, filter, fixedDimensionTypes)
    }, [baseQuery, filter, fixedDimensions])

    useEffect(() => {
        if (dimensionListKey) {
            dispatch(addDimensionListLoadingState(dimensionListKey))

            return () => {
                dispatch(removeDimensionListLoadingState(dimensionListKey))
            }
        }
    }, [dispatch, dimensionListKey])

    useEffect(() => {
        nextPageRef.current = 1

        // Skip on initial fetch
        if (isInitalFetchSuccessRef.current) {
            setIsSearching(true)
        }
        fetchDimensions()
    }, [searchTerm, fetchDimensions])

    return useMemo(() => {
        const isLoading = !isInitalFetchSuccessRef.current && isFetching
        const isLoadingMore = isFetching && !isLoading && !isSearching
        const hasMore = Boolean(
            nextPageRef.current !== null &&
                baseQuery &&
                isFetchEnabledByFilter(baseQuery, filter)
        )

        return {
            dimensions,
            isFetching,
            isLoading,
            isSearching,
            isLoadingMore,
            error,
            hasMore,
            hasNoData,
            loadMore,
            isDisabledByFilter,
        }
    }, [
        baseQuery,
        dimensions,
        isFetching,
        isSearching,
        error,
        hasNoData,
        loadMore,
        filter,
        isDisabledByFilter,
    ])
}
