import cx from 'classnames'
import React from 'react'
import { Chip } from './chip'
import classes from './styles/axis.module.css'
import { useMetadataStore } from '@components/app-wrapper/metadata-provider'
import type { SupportedAxis } from '@constants/axis-types'
import { useAppSelector } from '@hooks'
import { getLayoutDimensions } from '@modules/get-layout-dimensions'
import { getAxisNames } from '@modules/layout'
import { getVisUiConfigInputType } from '@store/vis-ui-config-slice'

export type Side = 'start' | 'end'

interface AxisProps {
    axisId: SupportedAxis
    side: Side
    dimensionIds?: string[] | undefined
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({ axisId, side, dimensionIds }) => {
    const { getMetadataItem } = useMetadataStore()
    const inputType = useAppSelector(getVisUiConfigInputType)

    const dimensions = getLayoutDimensions({
        dimensionIds: dimensionIds || [],
        inputType,
        getMetadataItem,
    })

    return (
        <div
            className={cx({
                [classes.startAxis]: side === 'start',
                [classes.endAxis]: side === 'end',
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
