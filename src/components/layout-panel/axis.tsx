import { SortableContext } from '@dnd-kit/sortable'
import cx from 'classnames'
import { type FC } from 'react'
import { Chip } from './chip'
import { EmptyAxisDropArea } from './empty-axis-drop-area'
import classes from './styles/axis.module.css'
import { useLayoutDimensions } from './use-layout-dimensions'
import { useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { Axis as AxisTD } from '@types'

type AxisProps = {
    axisId: AxisTD
    dimensionIds?: string[]
}
const EMPTY_ARRAY = []

export const Axis: FC<AxisProps> = ({ axisId, dimensionIds = EMPTY_ARRAY }) => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const dimensions = useLayoutDimensions({
        dimensionIds: dimensionIds,
        outputType,
    })

    return (
        <SortableContext id={axisId} items={dimensionIds}>
            <div
                className={cx(classes.axisContainer, {
                    [classes.columns]: axisId === 'columns',
                    [classes.rows]: axisId === 'rows',
                    [classes.filters]: axisId === 'filters',
                })}
                data-test={`axis-${axisId}`}
            >
                <div className={classes.label}>{getAxisName(axisId)}</div>
                <div
                    className={classes.content}
                    data-test={`axis-content-${axisId}`}
                >
                    {dimensions.length === 0 ? (
                        <EmptyAxisDropArea axisId={axisId} />
                    ) : (
                        dimensions.map((dimension, i) => (
                            <Chip
                                key={dimension.id}
                                dimension={dimension}
                                axisId={axisId}
                                isLastItem={i === dimensionIds.length - 1}
                            />
                        ))
                    )}
                </div>
            </div>
        </SortableContext>
    )
}
