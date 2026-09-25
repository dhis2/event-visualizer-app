import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { ValueContainerDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    clearVisUiConfigCustomValue,
    getVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useCallback, type FC } from 'react'
import classes from './styles/value-axis.module.css'
import { ValueChip } from './value-chip'

const VALUE_DROPPABLE_DATA: ValueContainerDroppableData = {
    isValueContainer: true,
}

export const ValueAxis: FC = () => {
    const dispatch = useAppDispatch()
    const customValue = useAppSelector(getVisUiConfigCustomValue)

    const { active } = useDndContext()
    const { isOver, setNodeRef } = useDroppable({
        id: 'value',
        data: VALUE_DROPPABLE_DATA,
    })
    const canDropActiveDrag = getActiveDragData(active)?.canBeCustomValue

    const resetToCount = useCallback(
        () => dispatch(clearVisUiConfigCustomValue()),
        [dispatch]
    )

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
            <div className={classes.content} data-test="axis-content-value">
                {customValue ? (
                    <>
                        <ValueChip
                            customValue={customValue}
                            onReset={resetToCount}
                        />
                        <button
                            type="button"
                            className={classes.resetButton}
                            onClick={resetToCount}
                            data-test="value-axis-reset-button"
                        >
                            {i18n.t('Reset')}
                        </button>
                    </>
                ) : (
                    <Tooltip
                        content={i18n.t(
                            'Cells show a count. Drag or add a numeric data item here to change the cell value.'
                        )}
                        placement="bottom"
                        openDelay={800}
                        closeDelay={0}
                        dataTest="value-axis-count-tooltip"
                    >
                        <span className={classes.count}>{i18n.t('Count')}</span>
                    </Tooltip>
                )}
            </div>
        </div>
    )
}
