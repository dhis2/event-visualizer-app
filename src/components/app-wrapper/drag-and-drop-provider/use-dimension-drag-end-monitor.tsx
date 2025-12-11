import { useDndMonitor } from '@dnd-kit/core'
import { useCallback } from 'react'
import type { LayoutDragEndEvent } from './types'
import { useAppDispatch, useAddMetadata } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

export const useDimensionDragEndMonitor = (): void => {
    const addMetadata = useAddMetadata()
    const dispatch = useAppDispatch()
    const onDragEnd = useCallback(
        (event: LayoutDragEndEvent) => {
            // Only allow dropping if event data is present and dropping onto an axis
            if (
                !event.active.data.current ||
                !event.over ||
                !event.over.data.current?.axis
            ) {
                return
            }

            /* Items dragged from the sidebar need to provide a `getMetadata` function
             * that can be used to add the relevant metadata to the metadata store */
            if (typeof event.active.data.current?.getMetadata === 'function') {
                addMetadata(event.active.data.current.getMetadata())
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
        [addMetadata, dispatch]
    )

    useDndMonitor({ onDragEnd })
}
