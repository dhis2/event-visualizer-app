import cx from 'classnames'
import React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'
import { DimensionIcon } from '@components/dimension-item/dimension-icon'

// Presentational component used by dnd - do not add redux or dnd functionality

interface Dimension extends LayoutDimension {
    suffix?: string
}

interface ChipBaseProps {
    dimension: Dimension
}

export const ChipBase: React.FC<ChipBaseProps> = ({ dimension }) => {
    const name = dimension.name
    const dimensionType = dimension.dimensionType
    const suffix = dimension.suffix

    return (
        <div className={cx(classes.chipBase)}>
            <div className={classes.leftIcon}>
                <DimensionIcon dimensionType={dimensionType} />
            </div>
            <span className={classes.label}>
                <span className={classes.primary}>{name}</span>
                {suffix && (
                    <>
                        <span>,</span>
                        <span className={classes.secondary}>{suffix}</span>
                    </>
                )}
            </span>
        </div>
    )
}
