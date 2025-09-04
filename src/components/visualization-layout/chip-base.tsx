import cx from 'classnames'
import React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'
import { DimensionIcon } from '@components/dimension-item/dimension-icon'
import type { SupportedAxisId } from '@constants/axis-types'
import type { InputType } from '@constants/input-types'
import { getChipItems } from '@modules/get-chip-items'

// Presentational component used by dnd - do not add redux or dnd functionality

interface Dimension extends LayoutDimension {
    suffix?: string
}

interface ChipBaseProps {
    dimension: Dimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    inputType: InputType
    axisId: SupportedAxisId
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
            <div className={classes.leftIcon}>
                <DimensionIcon dimensionType={dimensionType} />
            </div>
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
