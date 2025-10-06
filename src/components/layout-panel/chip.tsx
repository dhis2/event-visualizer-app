import { Tooltip, IconMore16 } from '@dhis2/ui'
import cx from 'classnames'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { TooltipContent } from './tooltip-content'
import { useMetadataStore } from '@components/app-wrapper/metadata-provider'
import { IconButton } from '@components/dimension-item/icon-button'
import { useAppSelector } from '@hooks'
import { getConditionsTexts } from '@modules/get-conditions-texts'
import {
    getVisUiConfigInputType,
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
    const inputType = useAppSelector(getVisUiConfigInputType)
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )
    const items = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )

    const openChipMenu = () => {
        console.log('TODO Open chip menu for:', dimension.id)
    }

    const { getMetadataItem } = useMetadataStore()

    // Type guards for conditions
    const isConditionsObject = (
        val: unknown
    ): val is { condition?: unknown[]; legendSet?: unknown } => {
        return typeof val === 'object' && val !== null && !Array.isArray(val)
    }

    const hasConditions = () => {
        if (!conditions) {
            return false
        }
        if (Array.isArray(conditions)) {
            return conditions.length > 0
        }
        if (isConditionsObject(conditions)) {
            return (
                (conditions.condition && conditions.condition.length > 0) ||
                Boolean(conditions.legendSet)
            )
        }
        return false
    }

    const digitGroupSeparator = ',' // TODO get from redux store options
    const conditionsTexts = getConditionsTexts({
        conditions,
        dimension,
        formatValueOptions: { digitGroupSeparator, skipRounding: false },
        getMetadataItem,
    })

    const renderTooltipContent = () => (
        <TooltipContent
            dimension={dimension}
            conditionsTexts={conditionsTexts}
            axisId={axisId}
        />
    )

    return (
        <div
            className={cx(classes.chip, {
                [classes.chipEmpty]:
                    axisId === 'filters' &&
                    items.length === 0 &&
                    !hasConditions(),
            })}
            data-test="layout-dimension-chip"
        >
            <div className={classes.content}>
                <ChipBase
                    dimension={dimension}
                    conditionsLength={0} // TODO: https://dhis2.atlassian.net/browse/DHIS2-20105
                    itemsLength={items.length}
                    inputType={inputType}
                    axisId={axisId}
                />
                <Tooltip
                    content={renderTooltipContent()}
                    placement="bottom"
                    dataTest="layout-chip-tooltip"
                    closeDelay={0}
                >
                    {({ ref, onMouseOver, onMouseOut }) => (
                        <span
                            id={Math.random().toString(36)}
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
                                inputType={inputType}
                                axisId={axisId}
                            />
                        </span>
                    )}
                </Tooltip>
            </div>
            <div className={classes.menuButton}>
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
