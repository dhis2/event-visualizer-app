import React from 'react'
import { Axis } from './axis'
import classes from './styles/line-listing-layout.module.css'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'

const [AXIS_ID_COLUMNS, AXIS_ID_FILTERS] = SUPPORTED_AXIS_IDS

export const LineListingLayout = () => (
    <div className={classes.layoutContainer}>
        <Axis axisId={AXIS_ID_COLUMNS} side="left" />
        <Axis axisId={AXIS_ID_FILTERS} side="right" />
    </div>
)
