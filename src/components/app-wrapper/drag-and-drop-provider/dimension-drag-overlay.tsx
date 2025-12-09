import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/dimension-drag-overlay.module.css'
import type { DroppableData } from './types'
import { ChipBase } from '@components/layout-panel/chip-base'
import chipClasses from '@components/layout-panel/styles/chip.module.css'

const DragOverlayItem: FC<DroppableData> = ({ source, overlayItemProps }) =>
    source === 'sidebar' ? (
        <div>Dimension overlay item</div>
    ) : (
        <div
            className={cx(
                chipClasses.chip,
                chipClasses.dragging,
                classes.overlay,
                {
                    [chipClasses.chipEmpty]: !!overlayItemProps.itemsText,
                }
            )}
        >
            <ChipBase {...overlayItemProps} />
        </div>
    )

export const DimensionDragOverlay: FC = () => {
    const [draggedDimensionData, setDraggedDimensionData] =
        useState<DroppableData | null>(null)
    useDndMonitor({
        onDragStart(event) {
            setDraggedDimensionData(event.active.data.current as DroppableData)
        },
        onDragEnd() {
            setDraggedDimensionData(null)
        },
        onDragCancel() {
            setDraggedDimensionData(null)
        },
    })
    return (
        <DragOverlay dropAnimation={null}>
            {draggedDimensionData ? (
                <DragOverlayItem {...draggedDimensionData} />
            ) : null}
        </DragOverlay>
    )
}
