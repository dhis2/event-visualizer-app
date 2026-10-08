import { ChipBase } from '@components/layout-panel/axis/chip-base'
import {
    ChipContainer,
    ChipContent,
} from '@components/layout-panel/axis/chip-container'
import {
    DimensionItem,
    DimensionItemContainer,
} from '@components/sidebar/dimension-item'
import { IconAdd16, IconDelete16 } from '@dhis2/ui'
import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    clearMultiSelection,
    getMultiSelectedDimensionIds,
} from '@store/dimensions-selection-slice'
import cx from 'classnames'
import { useState, type FC, type ReactNode } from 'react'
import {
    isAxisSortableData,
    isCellValueDroppableData,
    isOverAxis,
    isSidebarSortableData,
} from './dnd-data'
import classes from './styles/dimension-drag-overlay.module.css'
import type { DraggedItemEventData } from './types'

const DragOverlayBadge: FC<{
    willRemove?: boolean
    willBecomeCellValue?: boolean
    multiSelectCount?: number
}> = ({ willRemove, willBecomeCellValue, multiSelectCount }) => {
    if (willBecomeCellValue) {
        return (
            <span
                className={cx(classes.badge, classes.addBadge)}
                data-test="chip-add-indicator"
            >
                <IconAdd16 color="#ffffff" />
            </span>
        )
    } else if (willRemove) {
        return (
            <span
                className={cx(classes.badge, classes.removeBadge)}
                data-test="chip-remove-indicator"
            >
                <IconDelete16 color="#ffffff" />
            </span>
        )
    } else if (typeof multiSelectCount === 'number' && multiSelectCount >= 2) {
        return (
            <span
                className={cx(classes.badge, classes.countBadge)}
                data-test="chip-multi-select-count"
            >
                {multiSelectCount}
            </span>
        )
    } else {
        return null
    }
}

const DragOverlayFrame: FC<{
    willRemove?: boolean
    willBecomeCellValue?: boolean
    multiSelectCount?: number
    children: ReactNode
}> = ({ willRemove, willBecomeCellValue, multiSelectCount, children }) => (
    <div className={classes.dragOverlay}>
        <div
            className={cx(classes.dragOverlayBox, {
                [classes.willRemove]: willRemove,
            })}
        >
            {children}
        </div>
        <DragOverlayBadge
            willRemove={willRemove}
            willBecomeCellValue={willBecomeCellValue}
            multiSelectCount={multiSelectCount}
        />
    </div>
)

const DragOverlayItem: FC<{
    data: DraggedItemEventData
    willRemove: boolean
    willBecomeCellValue: boolean
    multiSelectCount: number
}> = ({ data, willRemove, willBecomeCellValue, multiSelectCount }) => {
    if (isAxisSortableData(data)) {
        return (
            <DragOverlayFrame
                willRemove={willRemove}
                willBecomeCellValue={willBecomeCellValue}
            >
                <ChipContainer
                    isEmpty={data.overlayItemProps.isEmpty}
                    className={classes.chipClone}
                >
                    <ChipContent>
                        <ChipBase {...data.overlayItemProps} isDragging />
                    </ChipContent>
                </ChipContainer>
            </DragOverlayFrame>
        )
    } else if (isSidebarSortableData(data)) {
        return (
            <DragOverlayFrame
                multiSelectCount={multiSelectCount}
                willBecomeCellValue={willBecomeCellValue}
            >
                <DimensionItemContainer className={classes.itemClone}>
                    <DimensionItem
                        name={data.overlayItemProps.dimensionName}
                        dimensionType={data.overlayItemProps.dimensionType}
                    />
                </DimensionItemContainer>
            </DragOverlayFrame>
        )
    } else {
        return null
    }
}

export const DimensionDragOverlay: FC = () => {
    const dispatch = useAppDispatch()
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const [draggedDimensionData, setDraggedDimensionData] =
        useState<DraggedItemEventData | null>(null)
    const [willRemove, setWillRemove] = useState(false)
    const [willBecomeCellValue, setWillBecomeCellValue] = useState(false)
    const multiSelectCount =
        draggedDimensionData &&
        multiSelectedIds.includes(draggedDimensionData.dimensionId)
            ? multiSelectedIds.length
            : 0
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
        onDragOver(event) {
            const overData = event.over?.data.current
            const isOverCellValue = isCellValueDroppableData(overData)
            const dragged = event.active.data.current as
                DraggedItemEventData | undefined
            setWillBecomeCellValue(
                isOverCellValue && Boolean(dragged?.canBeCellValue)
            )
            /* The cell value axis is not a layout axis, but dropping there is a
             * clone rather than a removal. */
            setWillRemove(!isOverAxis(overData) && !isOverCellValue)
        },
        onDragEnd() {
            setDraggedDimensionData(null)
            setWillRemove(false)
            setWillBecomeCellValue(false)
        },
        onDragCancel() {
            setDraggedDimensionData(null)
            setWillRemove(false)
            setWillBecomeCellValue(false)
        },
    })

    return (
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
            {draggedDimensionData ? (
                <DragOverlayItem
                    data={draggedDimensionData}
                    willRemove={willRemove}
                    willBecomeCellValue={willBecomeCellValue}
                    multiSelectCount={multiSelectCount}
                />
            ) : null}
        </DragOverlay>
    )
}
