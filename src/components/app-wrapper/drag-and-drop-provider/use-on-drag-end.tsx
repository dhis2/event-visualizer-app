import { useCallback } from 'react'
import type {
    AxisSortableData,
    EmptyAxisDroppableData,
    LayoutDragEndEvent,
} from './types'
import { useAppDispatch } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

const isDraggedItemFromAxis = (input: object): input is AxisSortableData =>
    'sortable' in input &&
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'axis' in input &&
    'insertAfter' in input

const isEmptyAxisData = (input: object): input is EmptyAxisDroppableData =>
    'isEmptyAxis' in input && input.isEmptyAxis === true

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
            const targetIndex = isEmptyAxisData(overItemData)
                ? 0
                : overItemData.sortable.index
            const insertAfter = isEmptyAxisData(overItemData)
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
