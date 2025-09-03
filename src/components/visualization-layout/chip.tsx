import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import type { SupportedDimensionType } from '@constants/dimension-types'

export interface LayoutDimension {
    code?: string
    dimensionId: string
    dimensionType: SupportedDimensionType
    displayName?: string
    id: string
    name: string
    optionSet?: string
    programId?: string
    programStageId?: string
    valueType?: string
}

interface ChipProps {
    dimension: LayoutDimension
}

export const Chip: React.FC<ChipProps> = ({ dimension }) => {
    return (
        <div className={classes.chip} data-test="layout-dimension-chip">
            <div className={classes.content}>
                <ChipBase dimension={dimension} />
            </div>
        </div>
    )
}
