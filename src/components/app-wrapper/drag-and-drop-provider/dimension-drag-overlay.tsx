import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/dimension-drag-overlay.module.css'
import type { AxisSortableData, DraggedItemEventData } from './types'
import { ChipBase } from '@components/layout-panel/axis/chip-base'
import chipClasses from '@components/layout-panel/axis/styles/chip.module.css'
import {
    DimensionItem,
    DimensionItemContainer,
} from '@components/main-sidebar/dimension-item'

const isAxisSortableData = (data: object): data is AxisSortableData =>
    'axis' in data

const DragOverlayItem: FC<DraggedItemEventData> = (data) =>
    isAxisSortableData(data) ? (
        <div
            className={cx(
                chipClasses.chip,
                chipClasses.dragging,
                classes.overlay,
                {
                    [chipClasses.chipEmpty]: !!data.overlayItemProps.itemsText,
                }
            )}
        >
            <ChipBase {...data.overlayItemProps} isDragging />
        </div>
    ) : data.overlayItemProps.dimensionType ? (
        <DimensionItemContainer isDragOverlay>
            <DimensionItem
                name={data.overlayItemProps.dimensionName}
                dimensionType={data.overlayItemProps.dimensionType}
                onClick={() => undefined}
            />
        </DimensionItemContainer>
    ) : null

export const DimensionDragOverlay: FC = () => {
    const [draggedDimensionData, setDraggedDimensionData] =
        useState<DraggedItemEventData | null>(null)
    useDndMonitor({
        onDragStart(event) {
            setDraggedDimensionData(
                event.active.data.current as DraggedItemEventData
            )
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
