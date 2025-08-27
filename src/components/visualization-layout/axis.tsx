import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import React from 'react'
import { Chip } from './chip'
import classes from './styles/axis.module.css'
import type { SupportedAxisIds } from '@constants/axis-types'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'
import { SUPPORTED_DIMENSION_TYPES } from '@constants/dimension-types'

const [columns, filter] = SUPPORTED_AXIS_IDS

const [PERIOD, ORGANISATION_UNIT, PROGRAM_ATTRIBUTE] = SUPPORTED_DIMENSION_TYPES

const dimensions = [
    { name: 'Incident date', dimensionType: PERIOD },
    { name: 'Sierra Leone', dimensionType: ORGANISATION_UNIT },
    { name: 'Age', dimensionType: PROGRAM_ATTRIBUTE },
]

const getAxisNames = () => ({
    [columns]: i18n.t('Columns'),
    [filter]: i18n.t('Filter'),
})

type Side = 'left' | 'right'

interface AxisProps {
    axisId: SupportedAxisIds
    side: Side
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({ axisId, side }) => {
    return (
        <div
            className={cx({
                [classes.leftAxis]: side === 'left',
                [classes.rightAxis]: side === 'right',
            })}
            data-test={`axis-${axisId}-${side}`}
        >
            <div className={cx(classes.axisContainer)}>
                <div className={classes.label}>{getAxisName(axisId)}</div>
                <div className={classes.content}>
                    {dimensions.map((dimension, i) => (
                        <Chip key={`key-${i}`} dimension={dimension} />
                    ))}
                </div>
            </div>
        </div>
    )
}
