import {
    IconVisualizationLinelist24,
    IconVisualizationPivotTable24,
} from '@dhis2/ui'
import React, { FC } from 'react'
import type { SupportedVisType } from '../../../constants'

type ListItemIconProps = {
    iconType: SupportedVisType
    style?: { width: number; height: number }
}

export const ListItemIcon: FC<ListItemIconProps> = ({ iconType, style }) => {
    if (iconType === 'LINE_LIST') {
        return (
            <div style={style}>
                {/* TODO replace with the proper colored icon from assets */}
                <IconVisualizationLinelist24 />
            </div>
        )
    } else if (iconType === 'PIVOT_TABLE') {
        return (
            <div style={style}>
                <IconVisualizationPivotTable24 />
            </div>
        )
    }
}
