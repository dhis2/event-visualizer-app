import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/dimension-drag-overlay.module.css'
import type {
    AxisSortableData,
    DraggedItemEventData,
    SidebarSortableData,
} from './types'
import { ChipBase } from '@components/layout-panel/axis/chip-base'
import chipClasses from '@components/layout-panel/axis/styles/chip.module.css'
import {
    DimensionItem,
    DimensionItemContainer,
} from '@components/main-sidebar/dimension-item'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'

const isAxisSortableData = (data: object): data is AxisSortableData =>
    'axis' in data

const isSidebarSortableData = (data: object): data is SidebarSortableData =>
    'populateMetadata' in data

const DragOverlayItem: FC<
    DraggedItemEventData & { multiSelectCount: number }
> = ({ multiSelectCount, ...data }) => {
    if (isAxisSortableData(data)) {
        return (
            <div
                className={cx(
                    chipClasses.chip,
                    chipClasses.dragging,
                    classes.overlay,
                    {
                        [chipClasses.chipEmpty]:
                            !!data.overlayItemProps.itemsText,
                    }
                )}
            >
                <ChipBase {...data.overlayItemProps} isDragging />
            </div>
        )
    }
    if (data.overlayItemProps.dimensionType) {
        return (
            <DimensionItemContainer isDragOverlay>
                <DimensionItem
                    name={data.overlayItemProps.dimensionName}
                    dimensionType={data.overlayItemProps.dimensionType}
                />
                {multiSelectCount >= 2 && (
                    <span className={classes.countBadge}>
                        {multiSelectCount}
                    </span>
                )}
            </DimensionItemContainer>
        )
    }
    return null
}

export const DimensionDragOverlay: FC = () => {
    const dispatch = useAppDispatch()
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const [draggedDimensionData, setDraggedDimensionData] =
        useState<DraggedItemEventData | null>(null)
    useDndMonitor({
        onDragStart(event) {
            const data = event.active.data.current as DraggedItemEventData
            if (
                isSidebarSortableData(data) &&
                multiSelectedIds.length > 0 &&
                !multiSelectedIds.includes(data.dimensionId)
            ) {
                dispatch(clearMultiSelection())
            }
            setDraggedDimensionData(data)
        },
        onDragEnd() {
            setDraggedDimensionData(null)
        },
        onDragCancel() {
            setDraggedDimensionData(null)
        },
    })

    const multiSelectCount =
        draggedDimensionData &&
        isSidebarSortableData(draggedDimensionData) &&
        multiSelectedIds.includes(draggedDimensionData.dimensionId)
            ? multiSelectedIds.length
            : 0

    return (
        <DragOverlay dropAnimation={null}>
            {draggedDimensionData ? (
                <DragOverlayItem
                    {...draggedDimensionData}
                    multiSelectCount={multiSelectCount}
                />
            ) : null}
        </DragOverlay>
    )
}
