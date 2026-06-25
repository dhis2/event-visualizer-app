import { getDimensionLayoutBlockedMessage } from '@components/sidebar/sidebar-disabling'
import { visTypeDisplayNames } from '@dhis2/analytics'
import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    useAppDispatch,
    useAppSelector,
    useAppStore,
    useMetadataStore,
} from '@hooks'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
    getVisUiConfigCustomValue,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
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
    const { show: showAlert } = useAlert(
        ({ count, visTypeName }: { count: number; visTypeName: string }) =>
            i18n.t(
                '{{count}} dimension(s) were skipped because they cannot be used in a {{visTypeName}}.',
                { count, visTypeName }
            ),
        { type: 'info', duration: 2000 }
    )
    const metadataStore = useMetadataStore()
    const store = useAppStore()
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
                    const storeState = store.getState()
                    const visType = getVisUiConfigVisualizationType(storeState)
                    const customValue = getVisUiConfigCustomValue(storeState)

                    // Batch add from sidebar (metadata already populated eagerly)
                    const validIds = multiSelectedIds.filter((id) => {
                        const dim = metadataStore.getMetadataItem(id)
                        if (!dim) {
                            return true
                        }
                        return !getDimensionLayoutBlockedMessage({
                            dimension: dim as DimensionMetadataItem,
                            visualizationType: visType,
                            customValueId: customValue?.id ?? null,
                        })
                    })
                    const skippedCount =
                        multiSelectedIds.length - validIds.length

                    if (validIds.length > 0) {
                        dispatch(
                            addVisUiConfigLayoutDimensions({
                                axis: overItemData.axis,
                                dimensionIds: validIds,
                                insertIndex: targetIndex,
                                insertAfter,
                            })
                        )
                    }

                    if (skippedCount > 0) {
                        showAlert({
                            count: skippedCount,
                            visTypeName: visTypeDisplayNames[visType],
                        })
                    }
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
        [dispatch, multiSelectedIds, metadataStore, store, showAlert]
    )
}
