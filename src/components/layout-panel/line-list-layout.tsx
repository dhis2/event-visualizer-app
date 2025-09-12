import React from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListLayout = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId="columns" position="start" dimensionIds={columns} />
            <Axis axisId="filters" position="end" dimensionIds={filters} />
        </div>
    )
}
