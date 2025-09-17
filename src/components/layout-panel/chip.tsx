import { IconMore16 } from '@dhis2/ui'
import cx from 'classnames'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { IconButton } from '@components/dimension-item/icon-button'
import { useAppSelector } from '@hooks'
import {
    getVisUiConfigInputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionType, ValueType } from '@types'

export interface LayoutDimension {
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

    const hasConditions = () =>
        Boolean(conditions.condition?.length) || Boolean(conditions.legendSet)

    const openChipMenu = () => {
        console.log('TODO Open chip menu for:', dimension.id)
    }

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
                    conditionsLength={0} // TODO https://dhis2.atlassian.net/browse/DHIS2-20105
                    itemsLength={items.length}
                    inputType={inputType}
                    axisId={axisId}
                />
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
