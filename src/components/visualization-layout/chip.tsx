import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import type { SupportedDimensionType } from '@constants/dimension-types'

interface ChipDimension {
    id: string
    name: string
    dimensionType?: SupportedDimensionType
    optionSet?: string
    valueType?: string
}

interface ChipProps {
    dimension: ChipDimension
}

export const Chip: React.FC<ChipProps> = ({ dimension }) => {
    return (
        <div className={classes.chip} data-test="layout-dimension-chip">
            <div className={classes.content}>
                {
                    <div>
                        <ChipBase dimension={dimension} />
                    </div>
                }
            </div>
        </div>
    )
}
