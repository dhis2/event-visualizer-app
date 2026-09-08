import type { ChipBaseProps } from '@components/layout-panel/axis/chip-base'
import type { Active, DataRef, DragEndEvent, Over } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type { Axis } from '@types'

export type SidebarSortableData = {
    dimensionId: string
    overlayItemProps: ChipBaseProps
    populateMetadata: () => void
    isLayoutBlocked: boolean
    layoutBlockedMessage?: string
    canBeCustomValue: boolean
}

export type AxisSortableData = {
    dimensionId: string
    axis: Axis
    overlayItemProps: ChipBaseProps
    insertAfter: boolean
    isLayoutBlocked: boolean
    layoutBlockedMessage?: string
    canBeCustomValue: boolean
}

export type AxisContainerDroppableData = {
    axis: Axis
    isAxisContainer: true
}

export type ValueContainerDroppableData = {
    isValueContainer: true
}

export type DraggedItemEventData = (SidebarSortableData | AxisSortableData) &
    SortableData

export type AxisDropTargetData =
    (AxisSortableData & SortableData) | AxisContainerDroppableData

export type OverItemEventData = AxisDropTargetData | ValueContainerDroppableData

export interface LayoutDragEndEvent extends DragEndEvent {
    active: Omit<Active, 'data'> & {
        data: DataRef<DraggedItemEventData>
    }
    over:
        | (Omit<Over, 'data'> & {
              data: DataRef<OverItemEventData>
          })
        | null
}
