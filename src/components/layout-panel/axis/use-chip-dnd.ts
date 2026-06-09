import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { AxisSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { useDndContext } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppSelector } from '@hooks'
import { getAllowedTargetAxis } from '@modules/layout'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { Axis } from '@types'
import { useMemo, type CSSProperties } from 'react'
import type { LayoutDimension } from './chip'
import type { ChipBaseProps } from './chip-base'

type UseChipDndArgs = {
    dimension: LayoutDimension
    axisId: Axis
    chipBaseProps: ChipBaseProps
    insertAfter: boolean
}

type UseChipDndReturn = {
    sortable: ReturnType<typeof useSortable>
    setNodeRef: (node: HTMLElement | null) => void
    attributes: ReturnType<typeof useSortable>['attributes']
    listeners: DraggableSyntheticListeners
    isOver: boolean
    isDragging: boolean
    style: CSSProperties | undefined
}

export const useChipDnd = ({
    dimension,
    axisId,
    chipBaseProps,
    insertAfter,
}: UseChipDndArgs): UseChipDndReturn => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const allowedTargetAxis = useMemo(
        () => getAllowedTargetAxis([dimension], visType),
        [dimension, visType]
    )
    const droppableData = useMemo<AxisSortableData>(
        () => ({
            dimensionId: dimension.id,
            axis: axisId,
            overlayItemProps: chipBaseProps,
            insertAfter,
            allowedTargetAxis,
        }),
        [axisId, dimension, chipBaseProps, insertAfter, allowedTargetAxis]
    )

    const { active } = useDndContext()
    const disabledForActiveDrag = useMemo(
        () => getActiveDragData(active)?.allowedTargetAxis?.[axisId] === false,
        [active, axisId]
    )

    const sortable = useSortable({
        id: dimension.id,
        data: droppableData,
        disabled: disabledForActiveDrag ? { droppable: true } : false,
    })

    const {
        attributes,
        isDragging,
        isOver,
        isSorting,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = sortable

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

    return {
        sortable,
        setNodeRef,
        attributes,
        listeners,
        isOver,
        isDragging,
        style,
    }
}
