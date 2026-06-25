import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DimensionMetadataItem } from '@types'
import { useMemo, type CSSProperties } from 'react'

type UseDimensionItemDndArgs = {
    dimension: DimensionMetadataItem
    populateMetadata: () => void
    disabled: boolean
}

type UseDimensionItemDndReturn = {
    setNodeRef: (node: HTMLElement | null) => void
    attributes: ReturnType<typeof useSortable>['attributes']
    listeners: DraggableSyntheticListeners
    isDragging: boolean
    style: CSSProperties | undefined
}

export const useDimensionItemDnd = ({
    dimension,
    populateMetadata,
    disabled,
}: UseDimensionItemDndArgs): UseDimensionItemDndReturn => {
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
            isLayoutBlocked: false,
        }),
        [dimension, populateMetadata]
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
