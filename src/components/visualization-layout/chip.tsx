import { IconMore16 } from '@dhis2/ui'
import React from 'react'
import { ChipBase } from './chip-base'
import classes from './styles/chip.module.css'
import { IconButton } from '@components/dimension-item/icon-button'
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
