import { Layer, Popper, Tooltip, IconMore16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cx from 'classnames'
import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import { ChipBase, type ChipBaseProps } from './chip-base'
import { ChipMenu } from './chip-menu'
import { getChipItemsText } from './get-chip-items-text'
import { OverChipLocationMonitor } from './over-chip-location-monitor'
import classes from './styles/chip.module.css'
import insertMarkerClasses from './styles/insert-marker.module.css'
import { TooltipContent } from './tooltip-content'
import type {
    AxisSortableData,
    DraggedItemEventData,
} from '@components/app-wrapper/drag-and-drop-provider/types'
import { IconButton } from '@components/dimension-item/icon-button'
import { useAppDispatch, useAppSelector, useConditionsTexts } from '@hooks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import {
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
    getVisUiConfigOption,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionType, SavedVisualization, ValueType } from '@types'

export type LayoutDimension = {
    id: string
    dimensionId: string
    name: string
    dimensionType?: DimensionType
    dimensionItemType?: DimensionType
    optionSet?: string
    programId?: string
    programStageId?: string
    code?: string
    suffix?: string
    valueType?: ValueType
}

interface ChipProps {
    dimension: LayoutDimension
    axisId: Axis
}

export const Chip: FC<ChipProps> = ({ dimension, axisId }) => {
    const dispatch = useAppDispatch()
    const [insertAfter, setInsertAfter] = useState<boolean>(false)
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const digitGroupSeparator = useAppSelector((state) =>
        getVisUiConfigOption(state, 'digitGroupSeparator')
    ) as SavedVisualization['digitGroupSeparator']
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )
    const items = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const buttonRef = useRef<HTMLDivElement>(null)
    const [menuIsOpen, setMenuIsOpen] = useState(false)
    const toggleChipMenu = useCallback(() => {
        setMenuIsOpen((currentMenuIsOpen) => !currentMenuIsOpen)
    }, [])
    const openDimensionModal = useCallback(() => {
        dispatch(setUiActiveDimensionModal(dimension.id))
    }, [dispatch, dimension.id])
    const hasConditions = useMemo(
        () =>
            Boolean(conditions?.condition?.length) ||
            Boolean(conditions?.legendSet),
        [conditions]
    )
    const conditionsTexts = useConditionsTexts({
        conditions,
        dimension,
        formatValueOptions: { digitGroupSeparator },
    })
    const chipItemsText = useMemo(
        () =>
            getChipItemsText({
                dimension,
                conditionsLength: conditionsTexts.length,
                itemsLength: Array.isArray(items) ? items.length : 0,
                outputType,
                axisId,
            }),
        [dimension, conditionsTexts.length, items, outputType, axisId]
    )
    const chipBaseProps: ChipBaseProps = useMemo(
        () => ({
            dimensionType: dimension.dimensionType,
            dimensionName: dimension.name,
            suffix: dimension.suffix,
            itemsText: chipItemsText,
        }),
        [dimension, chipItemsText]
    )
    const droppableData = useMemo<AxisSortableData>(
        () => ({
            dimensionId: dimension.id,
            axis: axisId,
            overlayItemProps: chipBaseProps,
            insertAfter,
        }),
        [axisId, dimension, chipBaseProps, insertAfter]
    )
    const {
        active,
        activeIndex,
        attributes,
        index,
        isDragging,
        isOver,
        isSorting,
        listeners,
        rect,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: dimension.id,
        data: droppableData,
    })
    const style = useMemo(
        () =>
            transform
                ? {
                      transform: isSorting
                          ? undefined
                          : CSS.Translate.toString({
                                x: transform.x,
                                y: transform.y,
                                scaleX: 1,
                                scaleY: 1,
                            }),
                      transition,
                  }
                : undefined,
        [transform, isSorting, transition]
    )
    const showInsertMarker = useMemo(() => {
        /* Only show marker if there is an active item over the current
         * which is not the item itself */
        if (!active || !isOver || isDragging) {
            return false
        }
        /* For elements from a different axis or the sidebar we can always
         * show the marker now */
        const draggedItemData = active.data.current as DraggedItemEventData
        const isActiveElementFromSameAxis =
            'axis' in draggedItemData && draggedItemData.axis === axisId

        if (!isActiveElementFromSameAxis) {
            return true
        }
        /* When moving within an axis the items adjacent to the active item
         * need to be taken into account, since dropping after the previous
         * or before the next item is a no-op. */
        const adjacentIndex = insertAfter ? index + 1 : index - 1

        return adjacentIndex === activeIndex ? false : true
    }, [isDragging, isOver, insertAfter, index, active, activeIndex, axisId])

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={classes.draggableContainer}
            style={style}
            data-test={`layout-dimension-dnd-${dimension.id}`}
        >
            <div
                className={cx(classes.chip, {
                    [classes.chipEmpty]:
                        axisId === 'filters' &&
                        items.length === 0 &&
                        !hasConditions,
                    [classes.active]: isDragging,
                    [classes.showBlank]: !dimension.name,
                })}
                data-test="layout-dimension-chip"
            >
                <div
                    className={cx(classes.content, {
                        [insertMarkerClasses.withInsertMarker]:
                            showInsertMarker,
                        [insertMarkerClasses.atEnd]: insertAfter,
                    })}
                >
                    <Tooltip
                        content={
                            <TooltipContent
                                dimension={dimension}
                                conditionsTexts={conditionsTexts}
                                axisId={axisId}
                            />
                        }
                        placement="bottom"
                        dataTest="layout-chip-tooltip"
                        closeDelay={0}
                    >
                        {({ ref, onMouseOver, onMouseOut }) => (
                            <span
                                ref={ref}
                                onClick={openDimensionModal}
                                onMouseOver={onMouseOver}
                                onMouseOut={onMouseOut}
                            >
                                <ChipBase {...chipBaseProps} />
                            </span>
                        )}
                    </Tooltip>
                </div>
                <div ref={buttonRef}>
                    <IconButton
                        onClick={toggleChipMenu}
                        dataTest={'chip-menu-button'}
                        menuId={`chip-menu-${dimension.id}`}
                    >
                        <IconMore16 />
                    </IconButton>
                </div>
                {menuIsOpen && (
                    <Layer onBackdropClick={toggleChipMenu}>
                        <Popper reference={buttonRef} placement="bottom-start">
                            <ChipMenu
                                dimensionId={dimension.id}
                                axisId={axisId}
                                onClose={toggleChipMenu}
                            />
                        </Popper>
                    </Layer>
                )}
            </div>
            {isOver && !isDragging && rect.current && active && (
                <OverChipLocationMonitor
                    setInsertAfter={setInsertAfter}
                    rect={rect.current}
                    active={active}
                />
            )}
        </div>
    )
}
