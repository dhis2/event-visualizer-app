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
}

export type AxisSortableData = {
    dimensionId: string
    axis: Axis
    overlayItemProps: ChipBaseProps
    insertAfter: boolean
    isLayoutBlocked: boolean
    layoutBlockedMessage?: string
}

export type AxisContainerDroppableData = {
    axis: Axis
    isAxisContainer: true
}

/* The cell value axis is a drop target but not a layout axis, so this must not
 * carry an `axis` key — `isOverAxis` discriminates structurally on one. */
export type CellValueDroppableData = {
    isCellValueDroppable: true
}

export type DraggedItemEventData = (SidebarSortableData | AxisSortableData) &
    SortableData

/* The drop targets that belong to the layout proper — everything `isOverAxis`
 * accepts, and everything the move/insert logic can act on. */
export type LayoutDropTargetData =
    (AxisSortableData & SortableData) | AxisContainerDroppableData

export type OverItemEventData = LayoutDropTargetData | CellValueDroppableData

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
