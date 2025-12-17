import type { SortableData } from '@dnd-kit/sortable'
import { useCallback } from 'react'
import type {
    AxisContainerDroppableData,
    AxisSortableData,
    LayoutDragEndEvent,
} from './types'
import { useAppDispatch } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

const isDraggedItemFromAxis = (
    input: object
): input is AxisSortableData & SortableData =>
    'sortable' in input &&
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'axis' in input &&
    'insertAfter' in input

const isAxisContainerData = (
    input: object
): input is AxisContainerDroppableData =>
    'isAxisContainer' in input && input.isAxisContainer === true

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
            const targetIndex = isAxisContainerData(overItemData)
                ? 0
                : overItemData.sortable.index
            const insertAfter = isAxisContainerData(overItemData)
                ? false
                : overItemData.insertAfter

            if (isDraggedItemFromAxis(draggedItemData)) {
                // Move between axis
                dispatch(
                    moveVisUiConfigLayoutDimension({
                        dimensionId: draggedItemData.dimensionId,
                        sourceAxis: draggedItemData.axis,
                        targetAxis: overItemData.axis,
                        sourceIndex: draggedItemData.sortable.index,
                        targetIndex,
                        insertAfter,
                    })
                )
            } else {
                // Add from sidebar
                dispatch(
                    addVisUiConfigLayoutDimension({
                        axis: overItemData.axis,
                        dimensionId: draggedItemData.dimensionId,
                        insertIndex: targetIndex,
                        insertAfter,
                    })
                )
            }
        },
        [dispatch]
    )
}
