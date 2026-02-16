import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import type {
    optionsApi,
    FetchOptionsByOptionSetQueryArgs,
} from '@components/dimension-modal/conditions-modal-content/option-set-condition/options-api'
import type {
    dimensionsApi,
    FetchItemsByDimensionQueryArgs,
} from '@components/dimension-modal/dynamic-dimension-modal-content/dimensions-api'
import type { UseLazyQueryStateResult } from '@types'

type FetchOptionsFn =
    | ReturnType<typeof dimensionsApi.useLazyFetchItemsByDimensionQuery>[0]
    | ReturnType<typeof optionsApi.useLazyFetchOptionsByOptionSetQuery>[0]

type FetchResult = {
    items: unknown[]
    nextPage: number | null
}

type UseInfiniteTransferOptionsResult = Omit<
    UseLazyQueryStateResult<FetchResult>,
    'data'
> & {
    data: FetchResult['items']
    searchTerm: string
    setSearchTerm: (value: string) => void
    onEndReached: () => void
}

/**
 * Hook for managing infinite scroll/pagination with search for Transfer component options.
 *
 * @param dimensionId - The dimension ID to fetch items for (expected to be constant during component lifecycle)
 * @param useLazyQueryResult - Result tuple from a lazy RTK Query hook
 * @returns Extended query result with Transfer-compatible options, search state, and pagination handler
 */
export function useInfiniteTransferOptions(
    id: string,
    fetchOptionsFn: FetchOptionsFn,
    queryState: UseLazyQueryStateResult<FetchResult>
): UseInfiniteTransferOptionsResult {
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)
    const prevDebouncedSearchTermRef = useRef<string>(debouncedSearchTerm)
    const nextPageRef = useRef<number | null>(null)
    const [options, setOptions] = useState<
        UseInfiniteTransferOptionsResult['data']
    >([])
    const onEndReached = useCallback(() => {
        if (nextPageRef.current !== null) {
            fetchOptionsFn({
                id,
                page: nextPageRef.current,
                searchTerm: prevDebouncedSearchTermRef.current,
            })
        }
    }, [id, fetchOptionsFn])

    useEffect(() => {
        if (queryState.isUninitialized) {
            // Initial request on mount
            fetchOptionsFn({ id, page: 1 })
        } else if (debouncedSearchTerm !== prevDebouncedSearchTermRef.current) {
            // Requests when searchTerm changes
            prevDebouncedSearchTermRef.current = debouncedSearchTerm
            nextPageRef.current = null
            const fetchOptions:
                | FetchItemsByDimensionQueryArgs
                | FetchOptionsByOptionSetQueryArgs = {
                id,
                page: 1,
            }

            if (debouncedSearchTerm) {
                fetchOptions.searchTerm = debouncedSearchTerm
            }

            fetchOptionsFn(fetchOptions)
        }
    }, [debouncedSearchTerm, id, fetchOptionsFn, queryState.isUninitialized])

    useEffect(() => {
        if (queryState.data) {
            const newOptions = queryState.data.items

            const hasReceivedNextPage =
                typeof nextPageRef.current === 'number' &&
                nextPageRef.current > 1

            setOptions((prev) =>
                hasReceivedNextPage ? [...prev, ...newOptions] : newOptions
            )
            nextPageRef.current = queryState.data.nextPage
        }
    }, [queryState.data])

    return useMemo(
        () => ({
            ...queryState,
            data: options,
            searchTerm,
            setSearchTerm,
            onEndReached,
        }),
        [queryState, options, searchTerm, onEndReached]
    )
}
