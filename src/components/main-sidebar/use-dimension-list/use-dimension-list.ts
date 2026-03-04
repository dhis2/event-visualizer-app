import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounceValue, useIsMounted } from 'usehooks-ts'
import { defaultTransformer, type Transformer } from './default-transformer'
import {
    computeIsDisabledByFilter,
    filterDimensions,
    isFetchEnabledByFilter,
} from './filter-helpers'
import { buildQuery } from './query-helpers'
import { useListFetchState } from './use-list-fetch-state'
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
    const { fetchState, onFetchStart, onFetchSuccess, onFetchError } =
        useListFetchState()
    const isMounted = useIsMounted()
    const isInAsyncMode = useMemo(
        () =>
            Boolean(
                dimensionListKey &&
                    baseQuery &&
                    isFetchEnabledByFilter(baseQuery, filter)
            ),
        [dimensionListKey, baseQuery, filter]
    )
    const [resolvedSearchTerm, setResolvedSearchTerm] = useState<string>(() =>
        isInAsyncMode ? '' : searchTerm
    )
    // Combine and filter dimensions
    const dimensions = useMemo(() => {
        const filteredInitial = filterDimensions(
            fixedDimensions,
            resolvedSearchTerm,
            filter
        )
        // Fetched dimensions are filtered server-side but need client-side filter
        const filteredFetched = filterDimensions(
            fetchState.fetchedDimensions,
            '',
            filter
        )
        return [...filteredInitial, ...filteredFetched]
    }, [
        fixedDimensions,
        fetchState.fetchedDimensions,
        resolvedSearchTerm,
        filter,
    ])
    const isDisabledByFilter = useMemo(() => {
        const fixedDimensionTypes = fixedDimensions.map((d) => d.dimensionType)
        return computeIsDisabledByFilter(baseQuery, filter, fixedDimensionTypes)
    }, [baseQuery, filter, fixedDimensions])

    const [debouncedIsLoadingMore] = useDebounceValue(
        fetchState.isLoadingMore,
        300
    )

    // Stable fetch function with access to latest values
    const performFetch = useStableCallback(async (page: number) => {
        if (!isInAsyncMode || fetchState.isFetching) {
            /* Note that this is a theoretical safeguard. The UnifiedSearchInput
             * delays state updates until loading completes and the card components
             * remount when the data source changes so this cannot really be called
             * during a fetch. And the internal logic in this hook should not allow,
             * this function to be called when the hook is not in async mode */
            console.error(
                'performFetch was called during a fetch or for a fixed dimensions list, this should not happen.'
            )
            return
        }

        onFetchStart(page)
        appDispatch(setDimensionListLoadStart(dimensionListKey!))

        try {
            const rawResponseData = await appDispatch(
                api.endpoints.query.initiate(
                    buildQuery(baseQuery!, searchTerm, page)
                )
            ).unwrap()

            // Check if still mounted
            if (!isMounted()) {
                return
            }

            const { dimensions, nextPage } = transformer(rawResponseData)

            onFetchSuccess({
                dimensions,
                currentPage: page,
                nextPage,
                searchTerm,
            })
            appDispatch(setDimensionListLoadSuccess(dimensionListKey!))
            setResolvedSearchTerm(searchTerm)
        } catch (error) {
            if (!isMounted()) {
                return
            }
            const parsedError = parseEngineError(error)
            onFetchError(parsedError)
            appDispatch(
                setDimensionListLoadError({
                    id: dimensionListKey!,
                    error: parsedError,
                })
            )
            setResolvedSearchTerm(searchTerm)
        }
    })
    const onMountAndSearchTermChange = useStableCallback(() => {
        if (isInAsyncMode) {
            performFetch(1)
        } else {
            setResolvedSearchTerm(searchTerm)
        }
    })

    const loadMore = useCallback(() => {
        if (fetchState.nextPage !== null && !fetchState.isFetching) {
            performFetch(fetchState.nextPage)
        }
    }, [fetchState.nextPage, fetchState.isFetching, performFetch])

    // Register loading state in Redux on mount
    useEffect(() => {
        if (dimensionListKey) {
            appDispatch(addDimensionListLoadingState(dimensionListKey))

            return () => {
                appDispatch(removeDimensionListLoadingState(dimensionListKey))
            }
        }
    }, [appDispatch, dimensionListKey])

    // Fetch whenever search term changes and on mount
    useEffect(() => {
        onMountAndSearchTermChange()
    }, [searchTerm, onMountAndSearchTermChange])

    return useMemo(
        () => ({
            dimensions,
            isLoading: fetchState.isLoading,
            isLoadingMore: debouncedIsLoadingMore,
            error: fetchState.error,
            hasMore: isInAsyncMode && fetchState.nextPage !== null,
            hasNoData: fixedDimensions.length === 0 && fetchState.hasNoData,
            loadMore,
            isDisabledByFilter,
        }),
        [
            isInAsyncMode,
            dimensions,
            fetchState.isLoading,
            fetchState.nextPage,
            fetchState.error,
            fetchState.hasNoData,
            debouncedIsLoadingMore,
            fixedDimensions.length,
            loadMore,
            isDisabledByFilter,
        ]
    )
}
