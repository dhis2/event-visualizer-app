import type { MetadataInput } from '@components/app-wrapper/metadata-helpers/types'
import type { ChipBaseProps } from '@components/layout-panel/chip-base'
import type { Axis } from '@types'

type CommonDroppableData = {
    dimensionId: string
}

export type SidebarDroppableData = CommonDroppableData & {
    source: 'sidebar'
    overlayItemProps: unknown
    metadata: MetadataInput
}

export type AxisDroppableData = CommonDroppableData & {
    source: Axis
    overlayItemProps: ChipBaseProps
}

export type DroppableData = SidebarDroppableData | AxisDroppableData

type SortableData = {
    sortable: { containerId: Axis }
}

export type OverDroppableData = (DroppableData & SortableData) | null
