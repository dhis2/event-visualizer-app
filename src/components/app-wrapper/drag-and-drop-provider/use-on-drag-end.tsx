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
    getDimensionBlockReason,
    type DimensionBlockReason,
} from '@modules/dimension'
import { resolveDimensionTetId, resolveTetId } from '@modules/layout'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
    getVisUiConfigCustomValue,
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import { useCallback } from 'react'
import {
    isAxisContainerData,
    isAxisSortableData,
    isSidebarSortableData,
} from './dnd-data'
import type { LayoutDragEndEvent, OverItemEventData } from './types'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

/* Skipped-dimension alerts can be long, so give the user 10 seconds to read. */
const SKIPPED_DIMENSIONS_ALERT_OPTIONS = { duration: 10000 }

type SkippedByReason = Record<DimensionBlockReason, string[]>

type PartitionMultiSelectedDimensionsArgs = {
    ids: string[]
    metadataStore: ReturnType<typeof useMetadataStore>
    visualizationType: ReturnType<typeof getVisUiConfigVisualizationType>
    customValueId: string | null
    layoutTetId: string | null
}

const partitionMultiSelectedDimensions = ({
    ids,
    metadataStore,
    visualizationType,
    customValueId,
    layoutTetId,
}: PartitionMultiSelectedDimensionsArgs): {
    validIds: string[]
    skippedByReason: SkippedByReason
} => {
    const skippedByReason: SkippedByReason = {
        customValue: [],
        visType: [],
        crossTet: [],
    }
    const validIds = ids.filter((id) => {
        const dim = metadataStore.getDimensionMetadataItem(id)
        if (!dim) {
            throw new Error(
                `Dimension "${id}" is in multi-selection but has no metadata entry`
            )
        }
        const reason = getDimensionBlockReason({
            dimension: dim,
            visualizationType,
            customValueId,
            layoutTetId,
            dimensionTetId: resolveDimensionTetId(dim, metadataStore),
        })
        if (reason) {
            skippedByReason[reason].push(dim.name)
            return false
        }
        return true
    })
    return { validIds, skippedByReason }
}

const getDropTarget = (
    overItemData: OverItemEventData
): { targetIndex: number; insertAfter: boolean } =>
    isAxisContainerData(overItemData)
        ? { targetIndex: 0, insertAfter: false }
        : {
              targetIndex: overItemData.sortable.index,
              insertAfter: overItemData.insertAfter,
          }

export const useOnDragEnd = (): OnDragEndFn => {
    const dispatch = useAppDispatch()
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const { show: showVisTypeAlert } = useAlert(
        ({ list, visTypeName }: { list: string; visTypeName: string }) =>
            i18n.t(
                'Some dimensions were not added because they cannot be used in a {{visTypeName}}: {{list}}.',
                { list, visTypeName, nsSeparator: '^^' }
            ),
        SKIPPED_DIMENSIONS_ALERT_OPTIONS
    )
    const { show: showCrossTetAlert } = useAlert(
        ({ list, layoutTetName }: { list: string; layoutTetName: string }) =>
            i18n.t(
                'Some dimensions were not added because they cannot be combined with {{- layoutTetName}} dimensions: {{list}}.',
                { list, layoutTetName, nsSeparator: '^^' }
            ),
        SKIPPED_DIMENSIONS_ALERT_OPTIONS
    )
    const { show: showCustomValueAlert } = useAlert(
        ({ name }: { name: string }) =>
            i18n.t(
                '{{- name}} was not added because it is already used as the custom value.',
                { name, nsSeparator: '^^' }
            ),
        SKIPPED_DIMENSIONS_ALERT_OPTIONS
    )
    const metadataStore = useMetadataStore()
    const store = useAppStore()
    const listFormatter = useListFormatter({ type: 'conjunction' })

    const showSkippedDimensionAlerts = useCallback(
        (
            skippedByReason: SkippedByReason,
            visualizationType: ReturnType<
                typeof getVisUiConfigVisualizationType
            >,
            layoutTetId: string | null
        ) => {
            if (skippedByReason.visType.length > 0) {
                showVisTypeAlert({
                    list: listFormatter.format(skippedByReason.visType),
                    visTypeName: visTypeDisplayNames[visualizationType],
                })
            }
            if (skippedByReason.crossTet.length > 0) {
                showCrossTetAlert({
                    list: listFormatter.format(skippedByReason.crossTet),
                    layoutTetName: layoutTetId
                        ? (metadataStore.getMetadataItem(layoutTetId)?.name ??
                          '')
                        : '',
                })
            }
            if (skippedByReason.customValue.length > 0) {
                showCustomValueAlert({ name: skippedByReason.customValue[0] })
            }
        },
        [
            metadataStore,
            listFormatter,
            showVisTypeAlert,
            showCrossTetAlert,
            showCustomValueAlert,
        ]
    )

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
            const { targetIndex, insertAfter } = getDropTarget(overItemData)

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
                const layoutTetId = resolveTetId(
                    getVisUiConfigLayoutAllDimensionIds(storeState),
                    metadataStore
                )

                // Batch add from sidebar (metadata already populated eagerly)
                const { validIds, skippedByReason } =
                    partitionMultiSelectedDimensions({
                        ids: multiSelectedIds,
                        metadataStore,
                        visualizationType: visType,
                        customValueId: customValue?.id ?? null,
                        layoutTetId,
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

                showSkippedDimensionAlerts(
                    skippedByReason,
                    visType,
                    layoutTetId
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
        },
        [
            dispatch,
            multiSelectedIds,
            metadataStore,
            store,
            showSkippedDimensionAlerts,
        ]
    )
}
