import { useDroppable } from '@dnd-kit/core'
import cx from 'classnames'
import { useMemo, type FC } from 'react'
import classes from './styles/empty-axis-drop-area.module.css'
import insertMarkerClasses from './styles/insert-marker.module.css'
import type { EmptyAxisDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import type { Axis } from '@types'

export const EmptyAxisDropArea: FC<{ axisId: Axis }> = ({ axisId }) => {
    const droppableData = useMemo<EmptyAxisDroppableData>(
        () => ({ axis: axisId, isEmptyAxis: true }),
        [axisId]
    )

    const { setNodeRef, isOver } = useDroppable({
        id: `${axisId}-empty`,
        data: droppableData,
    })

    return (
        <div ref={setNodeRef} className={classes.container}>
            <div
                className={cx(classes.markerAnchor, {
                    [insertMarkerClasses.withInsertMarker]: isOver,
                })}
            />
        </div>
    )
}
