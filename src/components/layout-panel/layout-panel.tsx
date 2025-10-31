import cx from 'classnames'
import type { FC } from 'react'
import { LineListLayout } from './line-list-layout'
import { PivotTableLayout } from './pivot-table-layout'
import classes from './styles/layout-panel.module.css'
import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

export const LayoutPanel: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)

    return (
        <div
            className={cx(classes.container, {
                [classes.hidden]: !isLayoutPanelVisible,
            })}
        >
            <div className={classes.axesContainer}>
                {visualizationType === 'LINE_LIST' && <LineListLayout />}
                {visualizationType === 'PIVOT_TABLE' && <PivotTableLayout />}
            </div>
        </div>
    )
}
