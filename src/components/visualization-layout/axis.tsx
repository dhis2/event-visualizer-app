import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import React from 'react'
import { Chip } from './chip'
import classes from './styles/axis.module.css'
import type { SupportedAxisIds } from '@constants/axis-types'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'
import { useAppSelector } from '@hooks'
import { getLayoutDimensions } from '@modules/get-layout-dimensions'
import { getUiInputType } from '@store/ui-slice'

const [columns, filter] = SUPPORTED_AXIS_IDS

const getAxisNames = () => ({
    [columns]: i18n.t('Columns'),
    [filter]: i18n.t('Filter'),
})

type Side = 'left' | 'right'

interface AxisProps {
    axisId: SupportedAxisIds
    side: Side
    dimensionIds?: string[]
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({ axisId, side, dimensionIds }) => {
    const inputType = useAppSelector(getUiInputType)
    const dimensions = getLayoutDimensions({
        dimensionIds,
        inputType,
    })

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
                        <Chip
                            key={`key-${i}`}
                            dimension={dimension}
                            axisId={axisId}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
