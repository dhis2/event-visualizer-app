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
            const dimensionId = draggedItemData.dimensionId
            const targetAxis = overItemData.axis
            const insertIndex = overItemData.isEmptyAxis
                ? 0 // insert at start when axis is empty
                : overItemData.insertAfter
                ? overItemData.sortable.index // insert after hovered item
                : overItemData.sortable.index - 1 // insert before hovered item

            if (insertIndex < 0) {
                throw new Error(
                    `Invalid insertIndex: ${insertIndex}. This should not happen.`
                )
            }

            if (!draggedItemData.axis) {
                // Add from sidebar
                dispatch(
                    addVisUiConfigLayoutDimension({
                        axis: targetAxis,
                        dimensionId,
                        insertIndex,
                    })
                )
            } else {
                // Move between axis
                dispatch(
                    moveVisUiConfigLayoutDimension({
                        dimensionId,
                        sourceAxis: draggedItemData.axis,
                        targetAxis,
                        insertIndex,
                    })
                )
            }
        },
        [dispatch]
    )
}
