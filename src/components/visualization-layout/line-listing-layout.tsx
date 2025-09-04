import React from 'react'
import { Axis, type Side } from './axis'
import classes from './styles/line-listing-layout.module.css'
import { useAppSelector } from '@hooks'
import { getUILayout } from '@store/ui-slice'

// Define the sides as constants with proper typing
const LEFT_SIDE: Side = 'left'
const RIGHT_SIDE: Side = 'right'

export const LineListingLayout = () => {
    const { columns, filters } = useAppSelector(getUILayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId="AXIS_ID_COLUMNS" side={LEFT_SIDE} dimensionIds={columns} />
            <Axis
                axisId="AXIS_ID_FILTERS"
                side={RIGHT_SIDE}
                dimensionIds={filters}
            />
        </div>
    )
}
