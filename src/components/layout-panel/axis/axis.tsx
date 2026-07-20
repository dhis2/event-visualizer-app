import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { AxisContainerDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { getAxisName } from '@modules/layout'
import type { Axis as AxisTD } from '@types'
import cx from 'classnames'
import { type FC, useMemo } from 'react'
import { Chip, type LayoutDimension } from './chip'
import classes from './styles/axis.module.css'
import insertMarkerClasses from './styles/drop-insert-marker.module.css'

type AxisProps = {
    axisId: AxisTD
    dimensions?: LayoutDimension[]
}
const EMPTY_ARRAY: LayoutDimension[] = []

export const Axis: FC<AxisProps> = ({ axisId, dimensions = EMPTY_ARRAY }) => {
    const dimensionIds = useMemo(
        () => dimensions.map((dimension) => dimension.id),
        [dimensions]
    )

    const axisContainerData = useMemo<AxisContainerDroppableData>(
        () => ({
            axis: axisId,
            isAxisContainer: true,
        }),
        [axisId]
    )

    const { active, over } = useDndContext()
    const disabled = useMemo(
        () => getActiveDragData(active)?.isLayoutBlocked ?? false,
        [active]
    )

    const { setNodeRef } = useDroppable({
        id: axisId,
        data: axisContainerData,
        disabled,
    })

    /*
     * Read the active drop target's axis — both
     * chip sortables and the axis container carry it — so the whole axis
     * highlights whether the drop lands on a chip or the empty area. */
    const overData = over?.data.current
    const isActiveDropTarget =
        overData !== undefined && 'axis' in overData && overData.axis === axisId

    return (
        <SortableContext id={axisId} items={dimensionIds}>
            <div
                ref={setNodeRef}
                className={cx(classes.container, {
                    [classes.columns]: axisId === 'columns',
                    [classes.rows]: axisId === 'rows',
                    [classes.filters]: axisId === 'filters',
                    [classes.activeDropTarget]: isActiveDropTarget,
                })}
                data-test={`axis-${axisId}`}
                aria-disabled={disabled || undefined}
            >
                <div className={classes.label}>{getAxisName(axisId)}</div>
                <div
                    className={classes.content}
                    data-test={`axis-content-${axisId}`}
                >
                    {dimensions.length === 0 && isActiveDropTarget && (
                        <div className={classes.emptyAxisInsertMarkerAnchor}>
                            <span className={insertMarkerClasses.marker} />
                        </div>
                    )}
                    {dimensions.length > 0 &&
                        dimensions.map((dimension) => (
                            <Chip
                                key={dimension.id}
                                dimension={dimension}
                                axisId={axisId}
                            />
                        ))}
                </div>
            </div>
        </SortableContext>
    )
}
