import { IconMore16 } from '@dhis2/ui'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { IconButton } from '@components/dimension-item/icon-button'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedDimensionType } from '@constants/dimension-types'
import type { SupportedValueType } from '@constants/value-types'
import { useAppSelector } from '@hooks'
import {
    getVisUiConfigInputType,
    getVisUiConfigItemsByDimension,
    getVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'

export interface LayoutDimension {
    id: string
    dimensionId: string
    name: string
    dimensionType?: SupportedDimensionType
    dimensionItemType?: string // TODO when is there a dimensionItemType and not dimensionType
    displayName?: string
    optionSet?: string
    programId?: string
    programStageId?: string
    code?: string
    suffix?: string
    valueType?: SupportedValueType
}

interface ChipProps {
    dimension: LayoutDimension
    axisId: SupportedAxis
}

export const Chip: React.FC<ChipProps> = ({ dimension, axisId }) => {
    const inputType = useAppSelector(getVisUiConfigInputType)
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )
    const items = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    return (
        <div className={classes.chip} data-test="layout-dimension-chip">
            <div className={classes.content}>
                <ChipBase
                    dimension={dimension}
                    conditionsLength={
                        Array.isArray(conditions) ? conditions.length : 0
                    }
                    itemsLength={Array.isArray(items) ? items.length : 0}
                    inputType={inputType}
                    axisId={axisId}
                />
                <IconButton
                    onClick={() => console.log('TODO - open menu')}
                    dataTest={'chip-menu-button'}
                    menuId={`chip-menu-${dimension.id}`}
                >
                    <IconMore16 />
                </IconButton>
            </div>
        </div>
    )
}
