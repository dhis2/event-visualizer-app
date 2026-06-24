import { useAppDispatch, useAppSelector } from '@hooks'
import { tSeedPrototypeGroupingOnAdd } from '@modules/prototype-default-grouping'
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
import {
    isAxisContainerData,
    isAxisSortableData,
    isSidebarSortableData,
} from './dnd-data'
import type { LayoutDragEndEvent } from './types'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

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

            if (isAxisSortableData(draggedItemData)) {
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
                    // PROTOTYPE ONLY
                    dispatch(tSeedPrototypeGroupingOnAdd(multiSelectedIds))
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
                    // PROTOTYPE ONLY
                    dispatch(
                        tSeedPrototypeGroupingOnAdd([
                            draggedItemData.dimensionId,
                        ])
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
