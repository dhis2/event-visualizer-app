import { getDimensionLayoutBlockedMessage } from '@components/sidebar/sidebar-disabling'
import { visTypeDisplayNames } from '@dhis2/analytics'
import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    useAppDispatch,
    useAppSelector,
    useAppStore,
    useListFormatter,
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

type PartitionMultiSelectedDimensionsArgs = {
    ids: string[]
    metadataStore: ReturnType<typeof useMetadataStore>
    visualizationType: ReturnType<typeof getVisUiConfigVisualizationType>
    customValueId: string | null
}

const partitionMultiSelectedDimensions = ({
    ids,
    metadataStore,
    visualizationType,
    customValueId,
}: PartitionMultiSelectedDimensionsArgs): {
    validIds: string[]
    skippedNames: string[]
} => {
    const skippedNames: string[] = []
    const validIds = ids.filter((id) => {
        const dim = metadataStore.getMetadataItem(id)
        if (!dim) {
            throw new Error(
                `Dimension "${id}" is in multi-selection but has no metadata entry`
            )
        }
        const blocked = !!getDimensionLayoutBlockedMessage({
            dimension: dim as DimensionMetadataItem,
            visualizationType,
            customValueId,
        })
        if (blocked) {
            skippedNames.push(dim.name)
        }
        return !blocked
    })
    return { validIds, skippedNames }
}

export const useOnDragEnd = (): OnDragEndFn => {
    const dispatch = useAppDispatch()
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const { show: showAlert } = useAlert(
        ({ list, visTypeName }: { list: string; visTypeName: string }) =>
            i18n.t(
                'The following dimensions cannot be used in a {{visTypeName}} and were skipped: {{list}}.',
                { list, visTypeName, nsSeparator: '^^' }
            ),
        // Message can be quite long so give the user 10 seconds to read it
        { duration: 10000 }
    )
    const metadataStore = useMetadataStore()
    const store = useAppStore()
    const listFormatter = useListFormatter({ type: 'conjunction' })
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
                return
            }

            if (!isSidebarSortableData(draggedItemData)) {
                throw new Error('Dropped an unexpected item')
            }

            const isMultiSelectDrag =
                multiSelectedIds.length >= 1 &&
                multiSelectedIds.includes(draggedItemData.dimensionId)

            if (isMultiSelectDrag) {
                const storeState = store.getState()
                const visType = getVisUiConfigVisualizationType(storeState)
                const customValue = getVisUiConfigCustomValue(storeState)

                // Batch add from sidebar (metadata already populated eagerly)
                const { validIds, skippedNames } =
                    partitionMultiSelectedDimensions({
                        ids: multiSelectedIds,
                        metadataStore,
                        visualizationType: visType,
                        customValueId: customValue?.id ?? null,
                    })

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

                if (skippedNames.length > 0) {
                    showAlert({
                        list: listFormatter.format(skippedNames),
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
        },
        [
            dispatch,
            multiSelectedIds,
            metadataStore,
            store,
            showAlert,
            listFormatter,
        ]
    )
}
