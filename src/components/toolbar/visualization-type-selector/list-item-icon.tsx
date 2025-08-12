import {
    IconVisualizationLinelist24,
    IconVisualizationPivotTable24,
} from '@dhis2/ui'
import type { FC } from 'react'
import type { SupportedVisType } from '@constants'

type ListItemIconProps = {
    iconType: SupportedVisType
    style?: { width: number; height: number }
}

// TODO use the large versions of the icons
// See: https://dhis2.atlassian.net/browse/DHIS2-19961
export const ListItemIcon: FC<ListItemIconProps> = ({ iconType, style }) => {
    if (iconType === 'LINE_LIST') {
        return (
            <div style={style}>
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
