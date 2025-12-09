import cx from 'classnames'
import React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'
import { DimensionTypeIcon } from '@components/dimension-item/dimension-type-icon'

// Presentational component used by dnd - do not add redux or dnd functionality

export interface ChipBaseProps {
    dimensionType: LayoutDimension['dimensionType']
    dimensionName: string
    itemsText: string
    suffix?: string
}

export const ChipBase: React.FC<ChipBaseProps> = ({
    dimensionType,
    dimensionName,
    itemsText,
    suffix,
}) => (
    <div className={cx(classes.chipBase)}>
        {dimensionType && (
            <div className={classes.leftIcon}>
                <DimensionTypeIcon dimensionType={dimensionType} />
            </div>
        )}
        <span className={classes.label}>
            <span className={classes.primary}>
                {suffix ? `${dimensionName},` : `${dimensionName}`}
            </span>
            {suffix && <span className={classes.secondary}>{suffix}</span>}
        </span>
        <span className={classes.items} data-test="chip-items">
            {itemsText}
        </span>
    </div>
)
