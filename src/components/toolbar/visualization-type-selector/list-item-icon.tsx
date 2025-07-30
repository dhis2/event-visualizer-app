import { VIS_TYPE_LINE_LIST, VIS_TYPE_PIVOT_TABLE } from '@dhis2/analytics'
import {
    IconVisualizationLinelist24,
    IconVisualizationPivotTable24,
} from '@dhis2/ui'
import React, { FC } from 'react'

type ListItemIconProps = {
    iconType: string
    style?: { width: number; height: number }
}

const ListItemIcon: FC<ListItemIconProps> = ({ iconType, style }) => {
    if (iconType === VIS_TYPE_LINE_LIST) {
        return (
            <div style={style}>
                {/* TODO replace with the proper colored icon from assets */}
                <IconVisualizationLinelist24 />
            </div>
        )
    } else if (iconType === VIS_TYPE_PIVOT_TABLE) {
        return (
            <div style={style}>
                <IconVisualizationPivotTable24 />
            </div>
        )
    }
}

export default ListItemIcon
