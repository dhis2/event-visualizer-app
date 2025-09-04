import { IconMore16 } from '@dhis2/ui'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { IconButton } from '@components/dimension-item/icon-button'
import type { SupportedAxisId } from '@constants/axis-types'
import type { SupportedDimensionType } from '@constants/dimension-types'
import type { SupportedValueType } from '@constants/value-types'
import { useAppSelector } from '@hooks'
import {
    getVisConfigInputType,
    getVisConfigItemsByDimension,
    getVisConfigConditionsByDimension,
} from '@store/vis-config-slice'

export interface LayoutDimension {
    id: string
    dimensionId: string
    dimensionType: SupportedDimensionType
    name: string
    displayName?: string
    dimensionItemType?: string // TODO when is there a dimensionItemType and not dimensionType
    optionSet?: string
    programId?: string
    programStageId?: string
    code?: string
    suffix?: string
    valueType?: SupportedValueType
}

interface ChipProps {
    dimension: LayoutDimension
    axisId: SupportedAxisId
}

export const Chip: React.FC<ChipProps> = ({ dimension, axisId }) => {
    const inputType = useAppSelector(getVisConfigInputType)
    const conditions = useAppSelector((state) =>
        getVisConfigConditionsByDimension(state, dimension.id)
    )
    const items = useAppSelector((state) =>
        getVisConfigItemsByDimension(state, dimension.id)
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
                    dataTest={`chip-menu-button-${dimension.id}`}
                    menuId={`chip-menu-${dimension.id}`}
                >
                    <IconMore16 />
                </IconButton>
            </div>
        </div>
    )
}
