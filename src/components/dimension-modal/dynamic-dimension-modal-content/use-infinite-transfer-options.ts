import type { Transfer } from '@dhis2/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import type { dimensionsApi } from './dimensions-api'

type UseLazyQueryResult = ReturnType<
    typeof dimensionsApi.useLazyFetchItemsByDimensionQuery
>
// | ReturnType<typeof anotherApi.useLazyOtherFetch>
export type TransferOptions = ComponentProps<typeof Transfer>['options']
type UseInfiniteTransferOptionsResult = UseLazyQueryResult[1] & {
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
    useLazyQueryResult: UseLazyQueryResult
): UseInfiniteTransferOptionsResult => {
    const [fetchOptionsFn, state] = useLazyQueryResult
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)
    const prevDebouncedSearchTermRef = useRef<string>(debouncedSearchTerm)
    const nextPageRef = useRef<number | null>(null)
    const [options, setOptions] = useState<TransferOptions>([])
    const onEndReached = useCallback(() => {
        if (nextPageRef.current !== null) {
            console.log(
                'end reached',
                prevDebouncedSearchTermRef.current,
                nextPageRef.current
            )
            fetchOptionsFn({
                dimensionId,
                page: nextPageRef.current,
                searchTerm: prevDebouncedSearchTermRef.current,
            })
        }
    }, [dimensionId, fetchOptionsFn])

    useEffect(() => {
        if (debouncedSearchTerm !== prevDebouncedSearchTermRef.current) {
            prevDebouncedSearchTermRef.current = debouncedSearchTerm
            setOptions([])
        }

        if (debouncedSearchTerm) {
            console.log('fetch with search', debouncedSearchTerm)
            fetchOptionsFn({
                dimensionId,
                page: 1,
                searchTerm: debouncedSearchTerm,
            })
        } else {
            console.log('fetch without search')
            fetchOptionsFn({
                dimensionId,
                page: 1,
            })
        }
    }, [debouncedSearchTerm, dimensionId, fetchOptionsFn])

    useEffect(() => {
        if (state.data) {
            console.log('data', state.data)
            // TODO: Figure out how to normalize and type the data for the second endpoint
            const newOptions: TransferOptions = state.data.items.map(
                ({ id, name }) => ({
                    label: name,
                    value: id,
                })
            )
            setOptions((prev) => [...prev, ...newOptions])
            nextPageRef.current = state.data.nextPage
        }
    }, [state.data])

    return useMemo(
        () => ({
            ...state,
            data: options,
            searchTerm,
            setSearchTerm,
            onEndReached,
        }),
        [state, options, searchTerm, onEndReached]
    )
}
