import type { Active, DataRef, DragEndEvent, Over } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type { ChipBaseProps } from '@components/layout-panel/chip-base'
import type { Axis } from '@types'

export type SidebarSortableData = SortableData & {
    dimensionId: string
    overlayItemProps: ChipBaseProps
}

export type AxisSortableData = SortableData & {
    dimensionId: string
    axis: Axis
    overlayItemProps: ChipBaseProps
    insertAfter: boolean
}

export type EmptyAxisDroppableData = {
    axis: Axis
    isEmptyAxis: true
}

export type DraggedItemEventData = SidebarSortableData | AxisSortableData

export type OverItemEventData = AxisSortableData | EmptyAxisDroppableData

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
