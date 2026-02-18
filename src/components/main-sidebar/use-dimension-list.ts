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
    dimensionListKey: DimensionListKey
    fixedDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
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

export const transformResponseData = (
    data: ResponseData
): {
    dimensions: DimensionMetadataItem[]
    nextPage: number | null
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
    const nextPage =
        data.pager.page < data.pager.pageCount ? data.pager.page + 1 : null

    if (dimensions.length > 0 && !isDimensionMetadataItem(dimensions[0])) {
        throw new Error(
            'Dimensions array item is not a valid dimension dimension metadata item'
        )
    }

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
    baseQuery: SingleQuery | undefined,
    filter: DataSourceFilter | null
): boolean => {
    if (!baseQuery) {
        return false
    } else if (!filter) {
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
    const isFetchEnabled = isFetchEnabledByFilter(baseQuery, filter)
    const hasMatchingFixedDimensionType =
        Array.isArray(fixedDimensionTypes) &&
        fixedDimensionTypes.some((dimensionType) => dimensionType === filter)

    return !isFetchEnabled && !hasMatchingFixedDimensionType
}

export const useDimensionList = ({
    dimensionListKey,
    fixedDimensions = DEFAULT_FIXED_DIMENSIONS,
    baseQuery,
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
    const prevBaseQueryRef = useRef(baseQuery)

    const fetchDimensions = useEffectEvent(async () => {
        if (
            !baseQuery ||
            nextPageRef.current === null ||
            !isFetchEnabledByFilter(baseQuery, filter)
        ) {
            setResolvedSearchTerm(searchTerm)
            return
        }

        dispatch(setDimensionListLoadStart(dimensionListKey))

        try {
            const responseData = (await dispatch(
                api.endpoints.query.initiate(
                    buildQuery(baseQuery, searchTerm, nextPageRef.current)
                )
            ).unwrap()) as ResponseData

            const { dimensions, nextPage } = transformResponseData(responseData)

            isInitalFetchSuccessRef.current = true
            setResolvedSearchTerm(searchTerm)
            setIsSearching(false)

            if (nextPageRef.current === 1) {
                setFetchedDimensions(dimensions)
            } else {
                setFetchedDimensions((prev) => [...prev, ...dimensions])
            }

            if (!searchTerm && fixedDimensions.length === 0) {
                setHasNoData(responseData.pager.total === 0)
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
        dispatch(addDimensionListLoadingState(dimensionListKey))

        return () => {
            dispatch(removeDimensionListLoadingState(dimensionListKey))
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

    useEffect(() => {
        if (
            (process.env.NODE_ENV === 'development' ||
                process.env.NODE_ENV === 'test') &&
            prevBaseQueryRef.current !== baseQuery
        ) {
            throw new Error('baseQuery changed - it should remain stable')
        }
        prevBaseQueryRef.current = baseQuery
    }, [baseQuery])

    return useMemo(() => {
        const isLoading = !isInitalFetchSuccessRef.current && isFetching
        const isLoadingMore = isFetching && !isLoading && !isSearching
        const hasMore =
            nextPageRef.current !== null &&
            isFetchEnabledByFilter(baseQuery, filter)

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
