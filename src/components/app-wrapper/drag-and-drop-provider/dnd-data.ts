import type { Active } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type {
    AxisContainerDroppableData,
    AxisSortableData,
    CellValueDroppableData,
    LayoutDropTargetData,
    SidebarSortableData,
} from './types'

export const CELL_VALUE_DROPPABLE_ID = 'cell-value'

export const isAxisSortableData = (
    input: object
): input is AxisSortableData & SortableData =>
    'sortable' in input &&
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'axis' in input &&
    'insertAfter' in input

export const isSidebarSortableData = (
    input: object
): input is SidebarSortableData & SortableData =>
    'dimensionId' in input &&
    'overlayItemProps' in input &&
    'populateMetadata' in input

export const isOverAxis = (
    overItemData: object | undefined
): overItemData is LayoutDropTargetData =>
    overItemData !== undefined && 'axis' in overItemData

export const isAxisContainerData = (
    input: object | undefined
): input is AxisContainerDroppableData =>
    input !== undefined &&
    'isAxisContainer' in input &&
    input.isAxisContainer === true

export const isCellValueDroppableData = (
    input: object | undefined
): input is CellValueDroppableData =>
    input !== undefined &&
    'isCellValueDroppable' in input &&
    input.isCellValueDroppable === true

export const getActiveDragData = (
    active: Active | null
): SidebarSortableData | AxisSortableData | undefined =>
    active?.data.current as SidebarSortableData | AxisSortableData | undefined
