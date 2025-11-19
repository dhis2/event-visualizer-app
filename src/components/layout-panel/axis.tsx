import cx from 'classnames'
import type { FC } from 'react'
import { Chip } from './chip'
import classes from './styles/axis.module.css'
import { useLayoutDimensions } from './use-layout-dimensions'
import { useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { Axis as AxisTD } from '@types'

type AxisProps = {
    axisId: AxisTD
    dimensionIds?: string[] | undefined
}

export const Axis: FC<AxisProps> = ({ axisId, dimensionIds }) => {
    const outputType = useAppSelector(getVisUiConfigOutputType)

    const dimensions = useLayoutDimensions({
        dimensionIds: dimensionIds || [],
        outputType,
    })

    return (
        <div
            className={cx(classes.axisContainer, {
                [classes.columns]: axisId === 'columns',
                [classes.rows]: axisId === 'rows',
                [classes.filters]: axisId === 'filters',
            })}
            data-test={`axis-${axisId}`}
        >
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
    )
}
