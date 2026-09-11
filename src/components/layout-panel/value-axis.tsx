import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { ValueContainerDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { CustomValueModal } from '@components/layout-panel/custom-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { IconEdit16 } from '@dhis2/ui'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { useAppSelector, useMetadataItem } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getVisUiConfigCustomValue } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/value-axis.module.css'

const VALUE_DROPPABLE_DATA: ValueContainerDroppableData = {
    isValueContainer: true,
}

export const ValueAxis: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { active } = useDndContext()
    const { isOver, setNodeRef } = useDroppable({
        id: 'value',
        data: VALUE_DROPPABLE_DATA,
    })
    const canDropActiveDrag = getActiveDragData(active)?.canBeCustomValue

    if (!dataSourceId || isVisualizationLoading) {
        return null
    }

    /* A dropped dimension keeps the item's own aggregation type, which has no
     * name worth showing next to the item. */
    const aggregationText =
        customValue && customValue.aggregationType !== 'DEFAULT'
            ? aggregationTypeDisplayNames[customValue.aggregationType]
            : ''

    return (
        <div
            ref={setNodeRef}
            className={cx(classes.container, classes.clickableContainer, {
                [classes.activeDropTarget]: isOver && canDropActiveDrag,
                [classes.blockedDropTarget]: isOver && !canDropActiveDrag,
            })}
            data-test="axis-value"
        >
            <button
                type="button"
                className={classes.cell}
                onClick={() => setIsModalOpen(true)}
                data-test="value-axis-button"
            >
                <div className={classes.label}>{i18n.t('Value')}</div>
                <div className={classes.content}>
                    <span className={classes.value}>
                        {customValue ? (
                            <>
                                {customValueMetadata?.name ?? ''}
                                {aggregationText && (
                                    <span className={classes.aggregation}>
                                        {` · ${aggregationText}`}
                                    </span>
                                )}
                            </>
                        ) : (
                            i18n.t('Count')
                        )}
                        <span
                            className={classes.hint}
                            aria-label={i18n.t('Change value')}
                        >
                            <IconEdit16 />
                        </span>
                    </span>
                </div>
            </button>
            {isModalOpen && (
                <CustomValueModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    )
}
