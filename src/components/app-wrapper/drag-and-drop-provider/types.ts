import type { Active, DataRef, DragEndEvent, Over } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type { ChipBaseProps } from '@components/layout-panel/chip-base'
import type { Axis } from '@types'

export type SidebarSortableData = {
    dimensionId: string
    overlayItemProps: ChipBaseProps
}

export type AxisSortableData = {
    dimensionId: string
    axis: Axis
    overlayItemProps: ChipBaseProps
    insertAfter: boolean
}

export type AxisContainerDroppableData = {
    axis: Axis
    isAxisContainer: true
    isEmpty: boolean
}

export type DraggedItemEventData = (SidebarSortableData | AxisSortableData) &
    SortableData

export type OverItemEventData =
    | (AxisSortableData & SortableData)
    | AxisContainerDroppableData

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
