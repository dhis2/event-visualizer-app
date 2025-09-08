import React from 'react'
import { Axis, type Side } from './axis'
import classes from './styles/line-listing-layout.module.css'
import { useAppSelector } from '@hooks'
import { getVisConfigLayout } from '@store/vis-config-slice'

// Define the sides as constants with proper typing
const LEFT_SIDE: Side = 'left'
const RIGHT_SIDE: Side = 'right'

export const LineListingLayout = () => {
    const { columns, filters } = useAppSelector(getVisConfigLayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId="columns" side={LEFT_SIDE} dimensionIds={columns} />
            <Axis axisId="filters" side={RIGHT_SIDE} dimensionIds={filters} />
        </div>
    )
}
