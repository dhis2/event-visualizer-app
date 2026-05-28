import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppSelector, useMetadataStore } from '@hooks'
import { getAllowedTargetAxis } from '@modules/layout'
import { getMultiSelectedDimensionIds } from '@store/dimensions-selection-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { Axis, DimensionMetadataItem } from '@types'
import { useMemo, type CSSProperties } from 'react'

type UseDimensionItemDndArgs = {
    dimension: DimensionMetadataItem
    populateMetadata: () => void
    selfAllowedTargetAxis: Record<Axis, boolean>
    disabled: boolean
}

type UseDimensionItemDndReturn = {
    setNodeRef: (node: HTMLElement | null) => void
    attributes: ReturnType<typeof useSortable>['attributes']
    listeners: DraggableSyntheticListeners
    isDragging: boolean
    style: CSSProperties | undefined
}

/* Encapsulates everything tied to the duration of a drag operation
 * originating from a sidebar dimension item: the multi-select intersection
 * for the per-axis allow-list, the sortable data payload, the dnd-kit
 * sortable hook call, and the drag-transform style. Values that exist
 * outside drags (selfAllowedTargetAxis used by the + icon,
 * populateMetadata used by clicks) stay with the component and are
 * passed in. */
export const useDimensionItemDnd = ({
    dimension,
    populateMetadata,
    selfAllowedTargetAxis,
    disabled,
}: UseDimensionItemDndArgs): UseDimensionItemDndReturn => {
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const metadataStore = useMetadataStore()
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const dragAllowedTargetAxis = useMemo<Record<Axis, boolean>>(() => {
        if (!multiSelectedIds.includes(dimension.id)) {
            return selfAllowedTargetAxis
        }
        const dimsInDrag = multiSelectedIds
            .map((id) =>
                id === dimension.id
                    ? dimension
                    : (metadataStore.getMetadataItem(id) as
                          | DimensionMetadataItem
                          | undefined)
            )
            .filter((d): d is DimensionMetadataItem => d !== undefined)
        return getAllowedTargetAxis(dimsInDrag, visType)
    }, [
        multiSelectedIds,
        dimension,
        metadataStore,
        visType,
        selfAllowedTargetAxis,
    ])

    const droppableData = useMemo<SidebarSortableData>(
        () => ({
            dimensionId: dimension.id,
            overlayItemProps: {
                dimensionType: dimension.dimensionType,
                dimensionName: dimension.name,
                itemsText: '',
                onClick: () => undefined,
            },
            populateMetadata,
            allowedTargetAxis: dragAllowedTargetAxis,
        }),
        [dimension, populateMetadata, dragAllowedTargetAxis]
    )

    const {
        attributes,
        isDragging,
        isSorting,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: `sidebar-${dimension.id}`,
        disabled,
        data: droppableData,
    })

    const style = useMemo<CSSProperties | undefined>(
        () =>
            transform
                ? {
                      transform: isSorting
                          ? undefined
                          : CSS.Translate.toString({
                                x: transform.x,
                                y: transform.y,
                                scaleX: 1,
                                scaleY: 1,
                            }),
                      transition,
                  }
                : undefined,
        [transform, isSorting, transition]
    )

    return { setNodeRef, attributes, listeners, isDragging, style }
}
