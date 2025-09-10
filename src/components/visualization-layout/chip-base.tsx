import cx from 'classnames'
import React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'
import { DimensionTypeIcon } from '@components/dimension-item/dimension-type-icon'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedInputType } from '@constants/input-types'
import { getChipItemsText } from '@modules/get-chip-items-text'

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
}) => (
    <div className={cx(classes.chipBase)}>
        {dimension.dimensionType && (
            <div className={classes.leftIcon}>
                <DimensionTypeIcon dimensionType={dimension.dimensionType} />
            </div>
        )}
        <span className={classes.label}>
            <span className={classes.primary}>
                {dimension.suffix ? `${dimension.name},` : `${dimension.name}`}
            </span>
            {dimension.suffix && (
                <span className={classes.secondary}>{dimension.suffix}</span>
            )}
        </span>
        <span className={classes.items} data-test="chip-items">
            {getChipItemsText({
                dimension,
                conditionsLength,
                itemsLength,
                inputType,
                axisId,
            })}
        </span>
    </div>
)
