import type { AxisSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { DimensionPopoverCard } from '@components/dimension-modal/dimension-popover-card'
import { IconButton } from '@components/shared/icon-button'
import { Layer, Popper, Tooltip, IconMore16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    useAppDispatch,
    useAppSelector,
    useConditionsTexts,
    useDimensionMetadataItem,
} from '@hooks'
import { isDimensionMetadataItem } from '@modules/metadata'
import {
    getUiActiveDimensionPopover,
    setUiActiveDimensionPopover,
} from '@store/ui-slice'
import {
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
    getVisUiConfigOption,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionType, SavedVisualization, ValueType } from '@types'
import cx from 'classnames'
import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import { ChipBase, type ChipBaseProps } from './chip-base'
import { ChipMenu } from './chip-menu'
import { DropInsertMarker } from './drop-insert-marker'
import { getChipItemsText } from './get-chip-items-text'
import classes from './styles/chip.module.css'
import { TooltipContent } from './tooltip-content'

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
    const chipRef = useRef<HTMLDivElement>(null)
    const [menuIsOpen, setMenuIsOpen] = useState(false)
    const toggleChipMenu = useCallback(() => {
        setMenuIsOpen((currentMenuIsOpen) => !currentMenuIsOpen)
    }, [])
    const activePopover = useAppSelector(getUiActiveDimensionPopover)
    const popoverIsOpen =
        activePopover?.source === 'layout' &&
        activePopover?.dimensionId === dimension.id &&
        activePopover.axisId === axisId
    const dimensionMetadata = useDimensionMetadataItem(dimension.id)
    const openDimensionPopover = useCallback(() => {
        dispatch(
            setUiActiveDimensionPopover({
                dimensionId: dimension.id,
                source: 'layout',
                axisId,
            })
        )
    }, [dispatch, dimension.id, axisId])
    const closeDimensionPopover = useCallback(() => {
        dispatch(setUiActiveDimensionPopover(null))
    }, [dispatch])
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
            onClick: openDimensionPopover,
        }),
        [dimension, chipItemsText, openDimensionPopover]
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
    const sortable = useSortable({
        id: dimension.id,
        data: droppableData,
    })
    const {
        attributes,
        isDragging,
        isOver,
        isSorting,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = sortable
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
                ref={chipRef}
                className={cx(classes.chip, {
                    [classes.chipEmpty]:
                        axisId === 'filters' &&
                        items.length === 0 &&
                        !hasConditions,
                    [classes.active]: isDragging,
                    [classes.showBlank]: !dimension.name,
                    [classes.popoverOpen]: popoverIsOpen,
                })}
                data-test="layout-dimension-chip"
            >
                <div className={classes.content}>
                    {popoverIsOpen ? (
                        <ChipBase {...chipBaseProps} />
                    ) : (
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
                            {({
                                ref,
                                onBlur,
                                onFocus,
                                onMouseOver,
                                onMouseOut,
                            }) => (
                                <span
                                    ref={ref}
                                    role="tooltip"
                                    onBlur={onBlur}
                                    onFocus={onFocus}
                                    onMouseOver={onMouseOver}
                                    onMouseOut={onMouseOut}
                                >
                                    <ChipBase {...chipBaseProps} />
                                </span>
                            )}
                        </Tooltip>
                    )}
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
                {popoverIsOpen &&
                    isDimensionMetadataItem(dimensionMetadata) && (
                        <Layer onBackdropClick={closeDimensionPopover}>
                            <Popper
                                reference={chipRef}
                                placement="bottom-start"
                            >
                                <DimensionPopoverCard
                                    dimension={dimensionMetadata}
                                    axisId={axisId}
                                    onClose={closeDimensionPopover}
                                />
                            </Popper>
                        </Layer>
                    )}
            </div>
            {isOver && !isDragging && (
                <DropInsertMarker
                    sortable={sortable}
                    setInsertAfter={setInsertAfter}
                    axisId={axisId}
                />
            )}
        </div>
    )
}
