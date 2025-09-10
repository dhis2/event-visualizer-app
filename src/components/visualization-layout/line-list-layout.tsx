import React from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListingLayout = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId="columns" side="left" dimensionIds={columns} />
            <Axis axisId="filters" side="right" dimensionIds={filters} />
        </div>
    )
}
