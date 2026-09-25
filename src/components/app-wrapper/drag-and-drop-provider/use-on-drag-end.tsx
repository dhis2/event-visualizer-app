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
} from '@modules/dimension/blocking'
import { resolveDimensionTetId, resolveLayoutContext } from '@modules/layout'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'
import { tSetCustomValue } from '@store/thunks'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
    moveVisUiConfigCustomValueToAxis,
    clearVisUiConfigCustomValue,
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import { useCallback, useEffect, useRef } from 'react'
import {
    isAxisContainerData,
    isAxisSortableData,
    isOverAxis,
    isSidebarSortableData,
    isValueChipData,
    isValueContainerData,
} from './dnd-data'
import type { AxisDropTargetData, LayoutDragEndEvent } from './types'

type OnDragEndFn = (event: LayoutDragEndEvent) => void

/* Skipped-dimension alerts can be long, so give the user 10 seconds to read. */
const SKIPPED_DIMENSIONS_ALERT_OPTIONS = { duration: 10000 }

type SkippedByReason = Record<DimensionBlockReason, string[]>

type PartitionMultiSelectedDimensionsArgs = {
    ids: string[]
    metadataStore: ReturnType<typeof useMetadataStore>
    visualizationType: ReturnType<typeof getVisUiConfigVisualizationType>
    layoutTetId: string | null
}

const partitionMultiSelectedDimensions = ({
    ids,
    metadataStore,
    visualizationType,
    layoutTetId,
}: PartitionMultiSelectedDimensionsArgs): {
    validIds: string[]
    skippedByReason: SkippedByReason
} => {
    const skippedByReason: SkippedByReason = {
        visType: [],
        crossTet: [],
    }
    const validIds = ids.filter((id) => {
        const dim = metadataStore.getDimensionMetadataItemOrThrow(id)
        const reason = getDimensionBlockReason({
            dimension: dim,
            visualizationType,
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
    overItemData: AxisDropTargetData
): { targetIndex: number; insertAfter: boolean } =>
    isAxisContainerData(overItemData)
        ? { targetIndex: 0, insertAfter: false }
        : {
              targetIndex: overItemData.sortable.index,
              insertAfter: overItemData.insertAfter,
          }

const VALUE_NOT_NUMERIC_ALERT_DURATION = 5000

/* A warning alert bar never hides itself, so it is hidden on a timer. */
const useAutoHidingWarningAlert = (message: string, duration: number) => {
    const { show, hide } = useAlert(message, { warning: true })
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => () => clearTimeout(hideTimeoutRef.current), [])

    return useCallback(() => {
        clearTimeout(hideTimeoutRef.current)
        show()
        hideTimeoutRef.current = setTimeout(hide, duration)
    }, [show, hide, duration])
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
    const showValueNotNumericAlert = useAutoHidingWarningAlert(
        i18n.t(
            'Only numeric data items can be used as the cell value, because the value is aggregated.'
        ),
        VALUE_NOT_NUMERIC_ALERT_DURATION
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
        },
        [metadataStore, listFormatter, showVisTypeAlert, showCrossTetAlert]
    )

    return useCallback(
        (event: LayoutDragEndEvent) => {
            const draggedItemData = event.active.data.current
            if (!draggedItemData) {
                return
            }

            const overItemData = event.over?.data.current

            /* The cell value holds a single dimension rather than a list, so a
             * drop on it replaces the value instead of inserting a chip. */
            if (isValueContainerData(overItemData)) {
                if (isValueChipData(draggedItemData)) {
                    return
                }
                if (!draggedItemData.canBeCustomValue) {
                    showValueNotNumericAlert()
                    return
                }
                if (isSidebarSortableData(draggedItemData)) {
                    draggedItemData.populateMetadata()
                }
                dispatch(tSetCustomValue(draggedItemData.dimensionId))
                dispatch(clearMultiSelection())
                return
            }

            if (isValueChipData(draggedItemData)) {
                if (isOverAxis(overItemData)) {
                    const { targetIndex, insertAfter } =
                        getDropTarget(overItemData)
                    dispatch(
                        moveVisUiConfigCustomValueToAxis({
                            axis: overItemData.axis,
                            insertIndex: targetIndex,
                            insertAfter,
                        })
                    )
                } else {
                    dispatch(clearVisUiConfigCustomValue())
                }
                return
            }

            if (!isOverAxis(overItemData)) {
                // Remove layout dimension when dropped ouside axes
                if (isAxisSortableData(draggedItemData)) {
                    dispatch(
                        removeVisUiConfigLayoutDimensionFromAxis({
                            axis: draggedItemData.axis,
                            dimensionId: draggedItemData.dimensionId,
                        })
                    )
                }
                // Ignore other items dropped outside of axes
                return
            }

            const { targetIndex, insertAfter } = getDropTarget(overItemData)

            if (isAxisSortableData(draggedItemData)) {
                const isDropInPlace =
                    !isAxisContainerData(overItemData) &&
                    overItemData.dimensionId === draggedItemData.dimensionId
                if (isDropInPlace) {
                    return
                }

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
                const { tetId: layoutTetId } = resolveLayoutContext(
                    getVisUiConfigLayoutAllDimensionIds(storeState),
                    metadataStore
                )

                // Batch add from sidebar (metadata already populated eagerly)
                const { validIds, skippedByReason } =
                    partitionMultiSelectedDimensions({
                        ids: multiSelectedIds,
                        metadataStore,
                        visualizationType: visType,
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
            showValueNotNumericAlert,
        ]
    )
}
