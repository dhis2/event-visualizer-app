import type { Active } from '@dnd-kit/core'
import type { SortableData } from '@dnd-kit/sortable'
import type {
    AxisContainerDroppableData,
    AxisDropTargetData,
    AxisSortableData,
    SidebarSortableData,
    ValueContainerDroppableData,
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

export const isOverAxis = (
    overItemData: object | undefined
): overItemData is AxisDropTargetData =>
    overItemData !== undefined && 'axis' in overItemData

export const isAxisContainerData = (
    input: object | undefined
): input is AxisContainerDroppableData =>
    input !== undefined &&
    'isAxisContainer' in input &&
    input.isAxisContainer === true

export const isValueContainerData = (
    input: object | undefined
): input is ValueContainerDroppableData =>
    input !== undefined &&
    'isValueContainer' in input &&
    input.isValueContainer === true

export const getActiveDragData = (
    active: Active | null
): SidebarSortableData | AxisSortableData | undefined =>
    active?.data.current as SidebarSortableData | AxisSortableData | undefined
