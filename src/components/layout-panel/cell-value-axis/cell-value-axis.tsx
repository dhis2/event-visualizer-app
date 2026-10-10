import {
    CELL_VALUE_DROPPABLE_ID,
    getActiveDragData,
    isCellValueDroppableData,
} from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { CellValueDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import axisClasses from '@components/layout-panel/axis/styles/axis.module.css'
import { WithTooltip } from '@components/layout-panel/bottom-bar/with-tooltip'
import { LayoutBlockedOverlay } from '@components/layout-panel/layout-blocked-overlay'
import { useDimensionSuffix } from '@components/layout-panel/use-layout-dimensions'
import i18n from '@dhis2/d2-i18n'
import { IconUndo16 } from '@dhis2/ui'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import {
    useAppDispatch,
    useAppSelector,
    useDimensionMetadataItem,
} from '@hooks'
import {
    clearVisUiConfigCellValue,
    getVisUiConfigCellValue,
    setVisUiConfigCellValue,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import cx from 'classnames'
import { useCallback, useMemo, type FC } from 'react'
import { CellValueAggregationMenu } from './cell-value-aggregation-menu'
import classes from './styles/cell-value-axis.module.css'

export const CellValueAxis: FC = () => {
    const dispatch = useAppDispatch()
    const cellValue = useAppSelector(getVisUiConfigCellValue)
    const cellValueMetadata = useDimensionMetadataItem(cellValue?.id)
    const suffix = useDimensionSuffix(cellValue?.id ?? '')

    const droppableData = useMemo<CellValueDroppableData>(
        () => ({ isCellValueDroppable: true }),
        []
    )
    const { setNodeRef } = useDroppable({
        id: CELL_VALUE_DROPPABLE_ID,
        data: droppableData,
    })
    const { active, over } = useDndContext()
    const activeDragData = getActiveDragData(active)
    const canTakeActiveDrag = Boolean(activeDragData?.canBeCellValue)
    /* An invalid dimension is rejected on drop, so the axis must not invite it
     * in the first place: no highlight, and hatching while such a drag is in
     * flight. When the layout is blocked too, the overlay already covers every
     * axis, and this one joins them rather than hatching itself. */
    const isActiveDropTarget =
        isCellValueDroppableData(over?.data.current) && canTakeActiveDrag
    const isDropBlocked =
        activeDragData !== undefined &&
        !canTakeActiveDrag &&
        !activeDragData.isLayoutBlocked

    const onReset = useCallback(
        () => dispatch(clearVisUiConfigCellValue()),
        [dispatch]
    )

    const onAggregationTypeChange = useCallback(
        (aggregationType: AggregationType) => {
            if (cellValue) {
                dispatch(
                    setVisUiConfigCellValue({
                        id: cellValue.id,
                        aggregationType,
                    })
                )
            }
        },
        [dispatch, cellValue]
    )

    /* A cell value whose metadata never arrived still has to render something,
     * so the raw id stands in for the name. */
    const name = cellValue && (cellValueMetadata?.name ?? cellValue.id)

    return (
        <div
            ref={setNodeRef}
            className={cx(axisClasses.container, classes.axis, {
                [classes.aboveLayoutBlockedOverlay]: canTakeActiveDrag,
                [axisClasses.activeDropTarget]: isActiveDropTarget,
            })}
            data-test="axis-value"
        >
            {isDropBlocked && <LayoutBlockedOverlay />}
            <div className={axisClasses.label}>{i18n.t('Value')}</div>
            <div className={classes.content} data-test="axis-content-value">
                {cellValue ? (
                    <>
                        <span
                            className={classes.text}
                            data-test="cell-value-label"
                        >
                            <span className={classes.name}>{name}</span>
                            {suffix && (
                                <span
                                    className={classes.suffix}
                                    data-test="cell-value-suffix"
                                >{`· ${suffix}`}</span>
                            )}
                        </span>
                        <span className={classes.separator} aria-hidden="true">
                            {'·'}
                        </span>
                        <CellValueAggregationMenu
                            aggregationType={cellValue.aggregationType}
                            itemAggregationType={
                                cellValueMetadata?.aggregationType
                            }
                            onChange={onAggregationTypeChange}
                        />
                        <WithTooltip
                            tooltipConfig={{
                                content: i18n.t('Reset to count'),
                            }}
                        >
                            <button
                                type="button"
                                className={classes.reset}
                                onClick={onReset}
                                aria-label={i18n.t('Reset to count')}
                                data-test="cell-value-reset"
                            >
                                <IconUndo16 />
                            </button>
                        </WithTooltip>
                    </>
                ) : (
                    <WithTooltip
                        tooltipConfig={{
                            content: i18n.t(
                                'Cells show a count. Drag a numeric data item here to show its value.'
                            ),
                        }}
                    >
                        <span
                            className={classes.text}
                            data-test="cell-value-label"
                        >
                            {i18n.t('Count')}
                        </span>
                    </WithTooltip>
                )}
            </div>
        </div>
    )
}
