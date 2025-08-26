import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import React from 'react'
import classes from './styles/axis.module.css'
import type { SupportedAxisIds } from '@constants/axis-types'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'

const [AXIS_ID_COLUMNS, AXIS_ID_FILTERS] = SUPPORTED_AXIS_IDS

const dimensions = [
    { id: 'dim1', name: 'Dimension 1' },
    { id: 'dim2', name: 'Dimension 2' },
    { id: 'dim3', name: 'Dimension 3' },
]

const getAxisNames = () => ({
    [AXIS_ID_COLUMNS]: i18n.t('Columns'),
    [AXIS_ID_FILTERS]: i18n.t('Filter'),
})
type Side = 'left' | 'right'

interface AxisProps {
    axisId: SupportedAxisIds
    side: Side
}

export const getAxisName = (axisId) => getAxisNames()[axisId]

export const Axis: React.FC<AxisProps> = ({ axisId, side }) => (
    <div
        className={cx({
            [classes.leftAxis]: side === 'left',
            [classes.rightAxis]: side === 'right',
        })}
    >
        {/* <div ref={setNodeRef} className={styles.lastDropzone}> */}
        <div id={axisId} className={cx(classes.axisContainer)}>
            <div className={classes.label}>{getAxisName(axisId)}</div>
            {/* <SortableContext id={axisId} items={dimensionIds}> */}
            <div className={classes.content}>
                {/* <DropZone
                        axisId={axisId}
                        firstElementId={dimensionIds[0]}
                        overLastDropZone={overLastDropZone}
                    /> */}
                {dimensions.map((dimension, i) => (
                    <div key={`key-${i}`}>{dimension.name}</div>
                ))}
            </div>
            {/* </SortableContext> */}
        </div>
        {/* </div> */}
    </div>
)
