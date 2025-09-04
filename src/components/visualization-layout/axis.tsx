import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import React from 'react'
import { Chip } from './chip'
import classes from './styles/axis.module.css'
import type { SupportedAxisId } from '@constants/axis-types'
import { useAppSelector } from '@hooks'
import { getLayoutDimensions } from '@modules/get-layout-dimensions'
import { getVisConfigInputType } from '@store/vis-config-slice'

const getAxisNames = () => ({
    AXIS_ID_COLUMNS: i18n.t('Columns'),
    AXIS_ID_FILTERS: i18n.t('Filter'),
    AXIS_ID_ROWS: i18n.t('Rows'),
    AXIS_ID_YOY_SERIES: i18n.t('YoY Series'),
    AXIS_ID_YOY_CATEGORY: i18n.t('YoY Category'),
})

export type Side = 'left' | 'right'

interface AxisProps {
    axisId: SupportedAxisId
    side: Side
    dimensionIds?: string[] | undefined
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({ axisId, side, dimensionIds }) => {
    const inputType = useAppSelector(getVisConfigInputType)
    const dimensions = getLayoutDimensions({
        dimensionIds: dimensionIds || [],
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
