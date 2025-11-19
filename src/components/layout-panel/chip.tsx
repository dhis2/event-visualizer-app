import { Tooltip, IconMore16 } from '@dhis2/ui'
import cx from 'classnames'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { TooltipContent } from './tooltip-content'
import { IconButton } from '@components/dimension-item/icon-button'
import { useAppSelector, useConditionsTexts } from '@hooks'
import {
    getVisUiConfigOutputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionType, ValueType } from '@types'

export type LayoutDimension = {
    id: string
    dimensionId: string
    name: string
    dimensionType?: DimensionType
    dimensionItemType?: DimensionType
    displayName?: string
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

export const Chip: React.FC<ChipProps> = ({ dimension, axisId }) => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )
    const items = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )

    const openChipMenu = () => {
        console.log('TODO Open chip menu for:', dimension.id)
    }

    const hasConditions =
        Boolean(conditions?.condition?.length) || Boolean(conditions?.legendSet)

    const digitGroupSeparator = 'COMMA' // TODO get from redux store options
    const conditionsTexts = useConditionsTexts({
        conditions,
        dimension,
        formatValueOptions: { digitGroupSeparator },
    })

    return (
        <div
            className={cx(classes.chip, {
                [classes.chipEmpty]:
                    axisId === 'filters' &&
                    items.length === 0 &&
                    !hasConditions,
            })}
            data-test="layout-dimension-chip"
        >
            <div className={classes.content}>
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
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                        >
                            <ChipBase
                                dimension={dimension}
                                conditionsLength={conditionsTexts.length}
                                itemsLength={
                                    Array.isArray(items) ? items.length : 0
                                }
                                outputType={outputType}
                                axisId={axisId}
                            />
                        </span>
                    )}
                </Tooltip>
            </div>
            <div>
                <IconButton
                    onClick={openChipMenu}
                    dataTest={'chip-menu-button'}
                    menuId={`chip-menu-${dimension.id}`}
                >
                    <IconMore16 />
                </IconButton>
            </div>
        </div>
    )
}
