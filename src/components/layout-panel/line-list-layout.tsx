import cx from 'classnames'
import { type FC } from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListLayout: FC = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)

    return (
        <div
            className={cx(classes.layoutContainer, {
                [classes.hidden]: !isLayoutPanelVisible,
            })}
        >
            <Axis axisId="columns" position="start" dimensionIds={columns} />
            <Axis axisId="filters" position="end" dimensionIds={filters} />
        </div>
    )
}
