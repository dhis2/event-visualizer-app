import {
    useDndMonitor,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback, type FC } from 'react'
import type { DroppableData, OverDroppableData } from './types'
import { useAppDispatch, useAddMetadata } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

// const FIRST_POSITION = 0
// const LAST_POSITION = -1
// const DIMENSION_PANEL_SOURCE = 'Sortable'

export const DndMonitor: FC = () => {
    const addMetadata = useAddMetadata()
    const dispatch = useAppDispatch()

    const onDragStart = useCallback(
        (event: DragStartEvent) => {
            const droppableData = event.active.data.current as DroppableData

            if (droppableData.source === 'sidebar') {
                addMetadata(droppableData.metadata)
            }
        },
        [addMetadata]
    )

    const onDragEnd = useCallback(
        (event: DragEndEvent) => {
            const droppableData = event.active.data.current as DroppableData
            const overData = event.over?.data.current as OverDroppableData

            if (!overData?.sortable?.containerId) {
                /* Only the layout axis are valid drop targets and these all have
                 * `SortableContext` with an `id` (which is available as `containerId` here) */
                console.log('No-op drop')
                return
            }

            const dimensionId = droppableData.dimensionId
            const targetAxis = overData.sortable.containerId
            const insertIndex = 0

            if (droppableData.source === 'sidebar') {
                console.log('adding')
                dispatch(
                    addVisUiConfigLayoutDimension({
                        axis: targetAxis,
                        dimensionId,
                        insertIndex,
                    })
                )
            } else {
                console.log('moving')
                const sourceAxis = droppableData.source
                dispatch(
                    moveVisUiConfigLayoutDimension({
                        dimensionId,
                        sourceAxis,
                        targetAxis,
                        insertIndex,
                    })
                )
            }
        },
        [dispatch]
    )

    useDndMonitor({ onDragStart, onDragEnd })

    return null
}
