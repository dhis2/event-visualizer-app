import { useCallback } from 'react'
import type { LayoutDragEndEvent } from './types'
import { useAppDispatch } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

export const useOnDragEnd = (): OnDragEndFn => {
    const dispatch = useAppDispatch()
    return useCallback(
        (event: LayoutDragEndEvent) => {
            // Only allow dropping if event data is present and dropping onto an axis
            if (
                !event.active.data.current ||
                !event.over ||
                !event.over.data.current?.axis
            ) {
                return
            }

            const draggedItemData = event.active.data.current
            const overItemData = event.over.data.current

            if (!draggedItemData.axis) {
                // Add from sidebar
                dispatch(
                    addVisUiConfigLayoutDimension({
                        axis: overItemData.axis,
                        dimensionId: draggedItemData.dimensionId,
                        insertIndex: overItemData.sortable.index,
                        insertAfter: overItemData.insertAfter,
                    })
                )
            } else {
                // Move between axis
                dispatch(
                    moveVisUiConfigLayoutDimension({
                        dimensionId: draggedItemData.dimensionId,
                        sourceAxis: draggedItemData.axis,
                        targetAxis: overItemData.axis,
                        sourceIndex: draggedItemData.sortable.index,
                        targetIndex: overItemData.sortable.index,
                        insertAfter: overItemData.insertAfter,
                    })
                )
            }
        },
        [dispatch]
    )
}
