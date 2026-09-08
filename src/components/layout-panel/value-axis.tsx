import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import type { ValueContainerDroppableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { CustomValueModal } from '@components/layout-panel/custom-value-modal'
import { DimensionTypeIcon } from '@components/shared/dimension-type-icon'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { IconEdit16 } from '@dhis2/ui'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import {
    useAppSelector,
    useLayoutContext,
    useMetadataItem,
    useMetadataStore,
} from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
import { isDimensionMetadataItem } from '@modules/metadata/item-guards'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/value-axis.module.css'

const VALUE_DROPPABLE_DATA: ValueContainerDroppableData = {
    isValueContainer: true,
}

export const ValueAxis: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programIds, tetId } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const isLineList = visualizationType === 'LINE_LIST'

    const { active } = useDndContext()
    const { isOver, setNodeRef } = useDroppable({
        id: 'value',
        data: VALUE_DROPPABLE_DATA,
        disabled: isLineList,
    })
    const canDropActiveDrag = getActiveDragData(active)?.canBeCustomValue

    if (!dataSourceId || isVisualizationLoading) {
        return null
    }

    if (isLineList) {
        const program = programIds[0]
            ? metadataStore.getProgramMetadataItem(programIds[0])
            : undefined
        const trackedEntityName = tetId
            ? metadataStore.getMetadataItem(tetId)?.name
            : undefined

        const countedThing = (() => {
            switch (outputType) {
                case 'TRACKED_ENTITY_INSTANCE':
                    return trackedEntityName ?? i18n.t('tracked entity')
                case 'ENROLLMENT':
                    return isDataSourceProgramWithRegistration(program)
                        ? (program.displayEnrollmentLabel ??
                              i18n.t('enrollment'))
                        : i18n.t('enrollment')
                default:
                    return isDataSourceProgramWithRegistration(program)
                        ? (program.displayEventLabel ?? i18n.t('event'))
                        : i18n.t('event')
            }
        })()

        return (
            <div className={classes.container} data-test="axis-value">
                <div className={classes.label}>{i18n.t('Rows')}</div>
                <div className={classes.content}>
                    <span className={classes.value}>
                        {i18n.t('One {{- countedThing}} per row', {
                            countedThing,
                            nsSeparator: '^^',
                        })}
                    </span>
                </div>
            </div>
        )
    }

    /* A custom value loaded from a saved visualization arrives without a
     * dimension type, and can only be a data element or an attribute. */
    const customValueDimensionType = isDimensionMetadataItem(
        customValueMetadata
    )
        ? customValueMetadata.dimensionType
        : 'DATA_ELEMENT'

    /* A dropped dimension keeps the item's own aggregation type, which has no
     * name worth showing next to the item. */
    const aggregationText =
        customValue && customValue.aggregationType !== 'DEFAULT'
            ? aggregationTypeDisplayNames[customValue.aggregationType]
            : ''

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
                <button
                    type="button"
                    className={classes.button}
                    onClick={() => setIsModalOpen(true)}
                    data-test="value-axis-button"
                >
                    {customValue && (
                        <span className={classes.prefixIcon}>
                            <DimensionTypeIcon
                                dimensionType={customValueDimensionType}
                            />
                        </span>
                    )}
                    <span className={classes.value}>
                        {customValue ? (
                            <>
                                <span className={classes.name}>
                                    {customValueMetadata?.name ?? ''}
                                </span>
                                {aggregationText && (
                                    <span className={classes.aggregation}>
                                        {`· ${aggregationText}`}
                                    </span>
                                )}
                            </>
                        ) : (
                            i18n.t('Count')
                        )}
                    </span>
                    <span className={classes.editIcon}>
                        <IconEdit16 />
                    </span>
                </button>
            </div>
            {isModalOpen && (
                <CustomValueModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    )
}
