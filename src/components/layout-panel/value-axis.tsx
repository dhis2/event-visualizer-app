import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { ValueContainerDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import i18n from '@dhis2/d2-i18n'
import { IconUndo16, Tooltip } from '@dhis2/ui'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    clearVisUiConfigCustomValue,
    getVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './styles/value-axis.module.css'
import { ValueAggregationSelect } from './value-aggregation-select'

const VALUE_DROPPABLE_DATA: ValueContainerDroppableData = {
    isValueContainer: true,
}

/* Long enough that the hint only appears when the user lingers on the label,
 * not every time the pointer passes over the axis. */
const COUNT_TOOLTIP_OPEN_DELAY = 800

const CountLabel: FC = () => (
    <Tooltip
        content={i18n.t(
            'Cells show a count. Drag a numeric data item here to show its value.'
        )}
        openDelay={COUNT_TOOLTIP_OPEN_DELAY}
        closeDelay={0}
        dataTest="value-count-tooltip"
    >
        {({ ref, onBlur, onFocus, onMouseOver, onMouseOut }) => (
            <span
                ref={ref}
                className={classes.count}
                onBlur={onBlur}
                onFocus={onFocus}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
            >
                {i18n.t('Count')}
            </span>
        )}
    </Tooltip>
)

const ResetButton: FC = () => {
    const dispatch = useAppDispatch()
    const label = i18n.t('Reset to count')

    return (
        <Tooltip content={label} closeDelay={0}>
            {({ ref, onBlur, onFocus, onMouseOver, onMouseOut }) => (
                <span
                    ref={ref}
                    className={classes.resetButtonAnchor}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                >
                    <button
                        type="button"
                        className={classes.resetButton}
                        onClick={() => dispatch(clearVisUiConfigCustomValue())}
                        aria-label={label}
                        data-test="value-reset-button"
                    >
                        <IconUndo16 />
                    </button>
                </span>
            )}
        </Tooltip>
    )
}

export const ValueAxis: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)

    const { active } = useDndContext()
    const { isOver, setNodeRef } = useDroppable({
        id: 'value',
        data: VALUE_DROPPABLE_DATA,
    })
    const canDropActiveDrag = getActiveDragData(active)?.canBeCustomValue

    if (!dataSourceId || isVisualizationLoading) {
        return null
    }

    return (
        <div
            ref={setNodeRef}
            className={cx(classes.container, {
                [classes.activeDropTarget]: isOver && canDropActiveDrag,
                [classes.blockedDropTarget]: isOver && !canDropActiveDrag,
            })}
            data-test="axis-value"
        >
            <div className={classes.label}>{i18n.t('Value')}</div>
            <div className={classes.content}>
                {customValue ? (
                    <>
                        <span className={classes.value}>
                            {customValueMetadata?.name ?? ''}
                            <span className={classes.separator}>{' · '}</span>
                            <ValueAggregationSelect customValue={customValue} />
                        </span>
                        <ResetButton />
                    </>
                ) : (
                    <span className={classes.value}>
                        <CountLabel />
                    </span>
                )}
            </div>
        </div>
    )
}
