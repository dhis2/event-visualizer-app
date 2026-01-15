import type { TransferOption as TransferOptionComponent } from '@dhis2/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import type { dimensionsApi } from './dimensions-api'

type UseLazyQueryResult = ReturnType<
    typeof dimensionsApi.useLazyFetchItemsByDimensionQuery
>
// | ReturnType<typeof anotherApi.useLazyOtherFetch>
type TransferOption = ComponentProps<typeof TransferOptionComponent>
type UseInfiniteTransferOptionsResult = UseLazyQueryResult[1] & {
    data: TransferOption[]
    searchTerm: string
    setSearchTerm: (value: string) => void
    onEndReached: () => void
}

export const useInfiniteTransferOptions = (
    dimensionId: string,
    useLazyQueryResult: UseLazyQueryResult
): UseInfiniteTransferOptionsResult => {
    const [fetchOptionsFn, state] = useLazyQueryResult
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)
    const prevDebouncedSearchTermRef = useRef<string>(debouncedSearchTerm)
    const nextPageRef = useRef<number | null>(1)
    const [options, setOptions] = useState<TransferOption[]>([])
    const onEndReached = useCallback(() => {
        if (nextPageRef.current !== null) {
            fetchOptionsFn({
                dimensionId,
                page: nextPageRef.current,
                searchTerm: debouncedSearchTerm,
            })
        }
    }, [debouncedSearchTerm, dimensionId, fetchOptionsFn])

    useEffect(() => {
        if (debouncedSearchTerm !== prevDebouncedSearchTermRef.current) {
            prevDebouncedSearchTermRef.current = debouncedSearchTerm
            nextPageRef.current = 1
            setOptions([])
            if (debouncedSearchTerm) {
                fetchOptionsFn({
                    dimensionId,
                    page: nextPageRef.current,
                    searchTerm: debouncedSearchTerm,
                })
            } else {
                fetchOptionsFn({
                    dimensionId,
                    page: nextPageRef.current,
                })
            }
        }
    }, [debouncedSearchTerm, dimensionId, fetchOptionsFn])

    useEffect(() => {
        if (state.data) {
            // TODO: Figure out how to normalize and type the data for the second endpoint
            const newOptions: TransferOption[] = state.data.dimensionItems.map(
                ({ id, name, disabled }) => ({
                    label: name,
                    value: id,
                    disabled,
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
