import type { SortableData } from '@dnd-kit/sortable'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import { useCallback } from 'react'
import type {
    AxisContainerDroppableData,
    AxisSortableData,
    LayoutDragEndEvent,
    SidebarSortableData,
} from './types'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

const isDraggedItemFromAxis = (
    input: object
): input is AxisSortableData & SortableData =>
    'sortable' in input &&
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'axis' in input &&
    'insertAfter' in input

const isSidebarSortableData = (
    input: object
): input is SidebarSortableData & SortableData =>
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'populateMetadata' in input

export const isAxisContainerData = (
    input: object | undefined
): input is AxisContainerDroppableData =>
    typeof input !== 'undefined' &&
    'isAxisContainer' in input &&
    input.isAxisContainer === true

export const useOnDragEnd = (): OnDragEndFn => {
    const dispatch = useAppDispatch()
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
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
            } else if (isSidebarSortableData(draggedItemData)) {
                const isMultiSelectDrag =
                    multiSelectedIds.length >= 1 &&
                    multiSelectedIds.includes(draggedItemData.dimensionId)

                if (isMultiSelectDrag) {
                    // Batch add from sidebar (metadata already populated eagerly)
                    dispatch(
                        addVisUiConfigLayoutDimensions({
                            axis: overItemData.axis,
                            dimensionIds: multiSelectedIds,
                            insertIndex: targetIndex,
                            insertAfter,
                        })
                    )
                } else {
                    // Single add from sidebar
                    draggedItemData.populateMetadata()
                    dispatch(
                        addVisUiConfigLayoutDimension({
                            axis: overItemData.axis,
                            dimensionId: draggedItemData.dimensionId,
                            insertIndex: targetIndex,
                            insertAfter,
                        })
                    )
                }
                dispatch(clearMultiSelection())
            } else {
                throw new Error('Dropped an unexpected item')
            }
        },
        [dispatch, multiSelectedIds]
    )
}
