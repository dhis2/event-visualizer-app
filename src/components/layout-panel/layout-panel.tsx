import type { FC } from 'react'
import { LineListLayout } from './line-list-layout'
import { useAppSelector } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

export const LayoutPanel: FC = () => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    switch (visType) {
        case 'LINE_LIST':
            return <LineListLayout />
        case 'PIVOT_TABLE':
            return <div>TODO: Pivot Table Layout Panel not implemented yet</div>
        default:
            return null
    }
}
