import cx from 'classnames'
import React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'
import { DimensionTypeIcon } from '@components/dimension-item/dimension-type-icon'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedInputType } from '@constants/input-types'
import { getChipItems } from '@modules/get-chip-items'

// Presentational component used by dnd - do not add redux or dnd functionality

interface ChipBaseProps {
    dimension: LayoutDimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    inputType: SupportedInputType
    axisId: SupportedAxis
}

export const ChipBase: React.FC<ChipBaseProps> = ({
    dimension,
    conditionsLength,
    itemsLength,
    inputType,
    axisId,
}) => {
    const name = dimension.name
    const dimensionType = dimension.dimensionType
    const suffix = dimension.suffix

    const chipItems = getChipItems({
        dimension,
        conditionsLength,
        itemsLength,
        inputType,
        axisId,
    })

    return (
        <div className={cx(classes.chipBase)}>
            {dimensionType && (
                <div className={classes.leftIcon}>
                    <DimensionTypeIcon dimensionType={dimensionType} />
                </div>
            )}
            <span className={classes.label}>
                <span className={classes.primary}>
                    {suffix ? `${name},` : `${name}`}
                </span>
                {suffix && <span className={classes.secondary}>{suffix}</span>}
            </span>
            {chipItems && (
                <span className={classes.items} data-test="chip-items">
                    {chipItems}
                </span>
            )}
        </div>
    )
}
