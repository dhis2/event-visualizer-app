import type { Active } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type {
    AxisContainerDroppableData,
    AxisSortableData,
    SidebarSortableData,
} from './types'

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

export const isAxisContainerData = (
    input: object | undefined
): input is AxisContainerDroppableData =>
    input !== undefined &&
    'isAxisContainer' in input &&
    input.isAxisContainer === true

export const getActiveDragData = (
    active: Active | null
): SidebarSortableData | AxisSortableData | undefined =>
    active?.data.current as SidebarSortableData | AxisSortableData | undefined
