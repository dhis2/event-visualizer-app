import type { FC } from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListLayout: FC = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)

    return (
        <>
            <div className={classes.groupLeft}>
                <Axis axisId="columns" dimensionIds={columns} />
            </div>
            <div className={classes.groupRight}>
                <Axis axisId="filters" dimensionIds={filters} />
            </div>
        </>
    )
}
