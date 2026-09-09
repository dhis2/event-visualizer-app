import { ChipBase } from '@components/layout-panel/axis/chip-base'
import {
    ChipContainer,
    ChipContent,
} from '@components/layout-panel/axis/chip-container'
import {
    DimensionItem,
    DimensionItemContainer,
} from '@components/sidebar/dimension-item'
import { IconDelete16 } from '@dhis2/ui'
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
    isOverAxis,
    isSidebarSortableData,
} from './dnd-data'
import classes from './styles/dimension-drag-overlay.module.css'
import type { DraggedItemEventData } from './types'

const DragOverlayBadge: FC<{
    willRemove?: boolean
    multiSelectCount?: number
}> = ({ willRemove, multiSelectCount }) => {
    if (willRemove) {
        return (
            <span
                className={classes.removeBadge}
                data-test="chip-remove-indicator"
            >
                <IconDelete16 color="#ffffff" />
            </span>
        )
    } else if (typeof multiSelectCount === 'number' && multiSelectCount >= 2) {
        return <span className={classes.countBadge}>{multiSelectCount}</span>
    } else {
        return null
    }
}

const DragOverlayFrame: FC<{
    willRemove?: boolean
    multiSelectCount?: number
    children: ReactNode
}> = ({ willRemove, multiSelectCount, children }) => (
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
            multiSelectCount={multiSelectCount}
        />
    </div>
)

const DragOverlayItem: FC<{
    data: DraggedItemEventData
    willRemove: boolean
    multiSelectCount: number
}> = ({ data, willRemove, multiSelectCount }) => {
    if (isAxisSortableData(data)) {
        return (
            <DragOverlayFrame willRemove={willRemove}>
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
            <DragOverlayFrame multiSelectCount={multiSelectCount}>
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
            setWillRemove(!isOverAxis(event.over?.data.current))
        },
        onDragEnd() {
            setDraggedDimensionData(null)
            setWillRemove(false)
        },
        onDragCancel() {
            setDraggedDimensionData(null)
            setWillRemove(false)
        },
    })

    return (
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
            {draggedDimensionData ? (
                <DragOverlayItem
                    data={draggedDimensionData}
                    willRemove={willRemove}
                    multiSelectCount={multiSelectCount}
                />
            ) : null}
        </DragOverlay>
    )
}
