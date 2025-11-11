import cx from 'classnames'
import React from 'react'
import { Chip } from './chip'
import { getLayoutDimensions } from './get-layout-dimensions'
import classes from './styles/axis.module.css'
import { useAppSelector, useMetadataStore } from '@hooks'
import { getAxisNames } from '@modules/layout'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { Axis as AxisTD } from '@types'

interface AxisProps {
    axisId: AxisTD
    position: 'start' | 'end'
    dimensionIds?: string[] | undefined
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({
    axisId,
    position,
    dimensionIds,
}) => {
    const { getMetadataItem } = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)

    const dimensions = getLayoutDimensions({
        dimensionIds: dimensionIds || [],
        outputType,
        getMetadataItem,
    })

    return (
        <div
            className={cx({
                [classes.startAxis]: position === 'start',
                [classes.endAxis]: position === 'end',
            })}
            data-test={`axis-${axisId}-${position}`}
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
