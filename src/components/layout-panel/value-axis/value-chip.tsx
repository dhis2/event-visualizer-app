import { aggregationTypeApi } from '@api/aggregation-type-api'
import type { ValueChipDraggableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import {
    ChipBase,
    type ChipBaseProps,
} from '@components/layout-panel/axis/chip-base'
import {
    ChipContainer,
    ChipContent,
} from '@components/layout-panel/axis/chip-container'
import { TooltipContent } from '@components/layout-panel/axis/tooltip-content'
import {
    useDimensionSuffix,
    useDimensionsWithSuffixes,
} from '@components/layout-panel/use-layout-dimensions'
import { IconButton } from '@components/shared/icon-button'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import { IconMore16, Layer, Popper, Tooltip } from '@dhis2/ui'
import { useDraggable } from '@dnd-kit/core'
import { useAppDispatch, useAppSelector, useConditionsTexts } from '@hooks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import {
    getVisUiConfigConditionsByDimension,
    getVisUiConfigOption,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import type { SavedVisualization } from '@types'
import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import classes from './styles/value-chip.module.css'
import { ValueChipMenu } from './value-chip-menu'

type ValueChipProps = {
    customValue: CustomValueObject
    onReset: () => void
}

export const ValueChip: FC<ValueChipProps> = ({ customValue, onReset }) => {
    const dispatch = useAppDispatch()
    const dimensionIds = useMemo(() => [customValue.id], [customValue.id])
    const dimension = useDimensionsWithSuffixes(dimensionIds)[customValue.id]
    const stageSuffix = useDimensionSuffix(customValue.id)
    const digitGroupSeparator = useAppSelector((state) =>
        getVisUiConfigOption(state, 'digitGroupSeparator')
    ) as SavedVisualization['digitGroupSeparator']
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, customValue.id)
    )
    const conditionsTexts = useConditionsTexts({
        conditions,
        dimension,
        formatValueOptions: { digitGroupSeparator },
    })
    const buttonRef = useRef<HTMLDivElement>(null)
    const [menuIsOpen, setMenuIsOpen] = useState(false)
    const toggleMenu = useCallback(() => setMenuIsOpen((isOpen) => !isOpen), [])
    const openDimensionModal = useCallback(() => {
        dispatch(setUiActiveDimensionModal(customValue.id))
    }, [dispatch, customValue.id])

    const { data: itemAggregationType } =
        aggregationTypeApi.useGetItemAggregationTypeQuery({
            dimensionId: customValue.id,
            dimensionType: dimension.dimensionType,
        })
    /* "Use item default" is shown as the aggregation it resolves to. A NONE
     * default is never used (see tSetCustomValue), so it isn't shown. */
    const resolvedAggregationType =
        customValue.aggregationType === 'DEFAULT'
            ? itemAggregationType !== 'NONE'
                ? itemAggregationType
                : undefined
            : customValue.aggregationType

    const suffix = [
        stageSuffix,
        resolvedAggregationType && resolvedAggregationType !== 'DEFAULT'
            ? aggregationTypeDisplayNames[resolvedAggregationType]
            : undefined,
    ]
        .filter(Boolean)
        .join(' · ')

    const chipBaseProps: ChipBaseProps = useMemo(
        () => ({
            dimensionType: dimension.dimensionType,
            dimensionName: dimension.name,
            suffix,
            itemsText: conditionsTexts.length
                ? conditionsTexts.length.toString()
                : '',
            onClick: openDimensionModal,
        }),
        [dimension, suffix, conditionsTexts.length, openDimensionModal]
    )

    const draggableData = useMemo<ValueChipDraggableData>(
        () => ({
            dimensionId: customValue.id,
            overlayItemProps: chipBaseProps,
            isValueChip: true,
            isLayoutBlocked: false,
            canBeCustomValue: true,
        }),
        [customValue.id, chipBaseProps]
    )
    const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
        id: `value-${customValue.id}`,
        data: draggableData,
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={classes.draggableContainer}
            data-test="value-chip"
        >
            <ChipContainer isDragging={isDragging}>
                <ChipContent>
                    <Tooltip
                        content={
                            <TooltipContent
                                dimension={dimension}
                                conditionsTexts={conditionsTexts}
                                axisId="value"
                            />
                        }
                        placement="bottom"
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
                </ChipContent>
                <div ref={buttonRef}>
                    <IconButton
                        onClick={toggleMenu}
                        dataTest="value-chip-menu-button"
                        menuId="value-chip-menu"
                    >
                        <IconMore16 />
                    </IconButton>
                </div>
                {menuIsOpen && (
                    <Layer onBackdropClick={toggleMenu}>
                        <Popper reference={buttonRef} placement="bottom-start">
                            <ValueChipMenu
                                dimension={dimension}
                                customValue={customValue}
                                onReset={onReset}
                                onClose={toggleMenu}
                            />
                        </Popper>
                    </Layer>
                )}
            </ChipContainer>
        </div>
    )
}
