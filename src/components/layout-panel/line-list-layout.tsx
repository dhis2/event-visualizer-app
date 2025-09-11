import React from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListLayout = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId="columns" side="start" dimensionIds={columns} />
            <Axis axisId="filters" side="end" dimensionIds={filters} />
        </div>
    )
}
