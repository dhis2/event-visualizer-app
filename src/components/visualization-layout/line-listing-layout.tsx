import React from 'react'
import { Axis } from './axis'
import classes from './styles/line-listing-layout.module.css'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'
import { useAppSelector } from '@hooks'
import { getUILayout } from '@store/ui-slice'

const [AXIS_ID_COLUMNS, AXIS_ID_FILTERS] = SUPPORTED_AXIS_IDS

export const LineListingLayout = () => {
    const { columns, filters } = useAppSelector(getUILayout)

    return (
        <div className={classes.layoutContainer}>
            <Axis axisId={AXIS_ID_COLUMNS} side="left" dimensionIds={columns} />
            <Axis
                axisId={AXIS_ID_FILTERS}
                side="right"
                dimensionIds={filters}
            />
        </div>
    )
}
