import type { FC } from 'react'
import { Axis } from './axis'
import classes from './styles/pivot-table-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const PivotTableLayout: FC = () => {
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

    return (
        <>
            <div className={classes.groupLeft}>
                <Axis axisId="columns" dimensionIds={columns} />
                <Axis axisId="rows" dimensionIds={rows} />
            </div>
            <div className={classes.groupRight}>
                <Axis axisId="filters" dimensionIds={filters} />
            </div>
        </>
    )
}
