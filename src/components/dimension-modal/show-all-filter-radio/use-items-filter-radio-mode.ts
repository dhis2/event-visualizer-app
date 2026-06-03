import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getVisUiConfigItemsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useCallback, useRef } from 'react'
import { useFilterRadioMode } from './use-filter-radio-mode'

/* Shared "Show all"/"Filter" wiring for the selection-based dimensions
 * (dynamic dims and status), whose filter is a list of item ids. The built
 * selection is stashed locally on switch to "Show all" so switching back to
 * "Filter" restores it; only "Update" commits whatever is in the store. */
export const useItemsFilterRadioMode = (dimension: DimensionMetadataItem) => {
    const dispatch = useAppDispatch()
    const items = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const stashRef = useRef<string[]>(items)

    const onEnterShowAll = useCallback(() => {
        stashRef.current = items
        dispatch(
            setVisUiConfigItemsByDimension({
                dimensionId: dimension.id,
                itemIds: [],
            })
        )
    }, [dispatch, dimension.id, items])

    const onEnterFilter = useCallback(() => {
        dispatch(
            setVisUiConfigItemsByDimension({
                dimensionId: dimension.id,
                itemIds: stashRef.current,
            })
        )
    }, [dispatch, dimension.id])

    return useFilterRadioMode({
        hasPersistedFilter: items.length > 0,
        onEnterShowAll,
        onEnterFilter,
    })
}
