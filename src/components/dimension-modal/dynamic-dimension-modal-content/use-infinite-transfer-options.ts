import type { Transfer } from '@dhis2/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import type {
    dimensionsApi,
    FetchItemsByDimensionQueryArgs,
    FetchResult,
} from './dimensions-api'
import type { UseLazyQueryStateResult } from '@types'

type FetchOptionsFn = ReturnType<
    typeof dimensionsApi.useLazyFetchItemsByDimensionQuery
>[0]
// | ReturnType<typeof anotherApi.useLazyOtherFetch>
export type TransferOptions = ComponentProps<typeof Transfer>['options']
type UseInfiniteTransferOptionsResult = Omit<
    UseLazyQueryStateResult<FetchResult>,
    'data'
> & {
    data: TransferOptions
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
export const useInfiniteTransferOptions = (
    dimensionId: string,
    fetchOptionsFn: FetchOptionsFn,
    queryState: UseLazyQueryStateResult<FetchResult>
): UseInfiniteTransferOptionsResult => {
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)
    const prevDebouncedSearchTermRef = useRef<string>(debouncedSearchTerm)
    const nextPageRef = useRef<number | null>(null)
    const [options, setOptions] = useState<TransferOptions>([])
    const onEndReached = useCallback(() => {
        if (nextPageRef.current !== null) {
            console.log('FETCH - on end reached')
            fetchOptionsFn({
                dimensionId,
                page: nextPageRef.current,
                searchTerm: prevDebouncedSearchTermRef.current,
            })
        }
    }, [dimensionId, fetchOptionsFn])

    useEffect(() => {
        if (queryState.isUninitialized) {
            // Initial request on mount
            console.log('FETCH - initial')
            fetchOptionsFn({ dimensionId, page: 1 })
        } else if (debouncedSearchTerm !== prevDebouncedSearchTermRef.current) {
            // Requests when searchTerm changes
            prevDebouncedSearchTermRef.current = debouncedSearchTerm
            nextPageRef.current = null
            const fetchOptions: FetchItemsByDimensionQueryArgs = {
                dimensionId,
                page: 1,
            }

            if (debouncedSearchTerm) {
                fetchOptions.searchTerm = debouncedSearchTerm
            }

            setOptions([])
            console.log('FETCH - search term changed')
            fetchOptionsFn(fetchOptions)
        }
    }, [
        debouncedSearchTerm,
        dimensionId,
        fetchOptionsFn,
        queryState.isUninitialized,
    ])

    useEffect(() => {
        if (queryState.data) {
            // TODO: Figure out how to normalize and type the data for the second endpoint
            const newOptions: TransferOptions = queryState.data.items.map(
                ({ id, name }) => ({
                    label: name,
                    value: id,
                })
            )
            console.log('setting options')
            setOptions((prev) => [...prev, ...newOptions])
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
