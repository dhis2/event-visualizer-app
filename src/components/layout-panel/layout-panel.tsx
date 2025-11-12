import cx from 'classnames'
import type { FC } from 'react'
import { Axis } from './axis'
import classes from './styles/layout-panel.module.css'
import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'

export const LayoutPanel: FC = () => {
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

    return (
        <div
            className={cx(classes.container, {
                [classes.hidden]: !isLayoutPanelVisible,
                [classes.lineList]: visualizationType === 'LINE_LIST',
            })}
        >
            <Axis axisId="columns" dimensionIds={columns} />
            {visualizationType !== 'LINE_LIST' && (
                <Axis axisId="rows" dimensionIds={rows} />
            )}
            <Axis axisId="filters" dimensionIds={filters} />
        </div>
    )
}
