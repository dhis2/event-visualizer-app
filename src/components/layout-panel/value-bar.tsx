import { CustomValueModal } from '@components/layout-panel/custom-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import {
    useAppSelector,
    useLayoutContext,
    useMetadataItem,
    useMetadataStore,
} from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/value-bar.module.css'

const EditIcon: FC = () => (
    <svg
        className={classes.editIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2.293a1 1 0 0 1 1.414 0l2.293 2.293a1 1 0 0 1 0 1.414l-7 7H11v1H2v-3.707l8-8Zm-7 8.414V13h2.293l5.5-5.5L8.5 5.207l-5.5 5.5ZM9.207 4.5 11.5 6.793l1.5-1.5L10.707 3l-1.5 1.5Z"
        />
        <path d="M14 14h-2v-1h2v1Z" />
    </svg>
)

export const ValueBar: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programIds, tetId } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!dataSourceId || isVisualizationLoading) {
        return null
    }

    /* Before the first update there is no visualization to describe, so the
     * bar names the cell value without naming what is counted. */
    const hasVisualization = !isVisualizationEmpty(currentVis)

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
                    ? (program.displayEnrollmentLabel ?? i18n.t('enrollment'))
                    : i18n.t('enrollment')
            default:
                return isDataSourceProgramWithRegistration(program)
                    ? (program.displayEventLabel ?? i18n.t('event'))
                    : i18n.t('event')
        }
    })()

    const isLineList = visualizationType === 'LINE_LIST'

    if (isLineList) {
        return (
            <div className={classes.bar} data-test="value-bar">
                <span className={classes.label}>{i18n.t('Rows')}</span>
                <span className={classes.value}>
                    {i18n.t('One {{- countedThing}} per row', {
                        countedThing,
                        nsSeparator: '^^',
                    })}
                </span>
            </div>
        )
    }

    const valueDescription = customValue
        ? `${customValueMetadata?.name} ${aggregationTypeDisplayNames[
              customValue.aggregationType
          ].toLocaleLowerCase()}`
        : hasVisualization
          ? i18n.t('{{- countedThing}} count', {
                countedThing,
                nsSeparator: '^^',
            })
          : i18n.t('Count')

    return (
        <>
            <button
                type="button"
                className={cx(classes.bar, classes.clickable, {
                    [classes.custom]: Boolean(customValue),
                })}
                onClick={() => setIsModalOpen(true)}
                data-test="value-bar"
            >
                <span className={classes.label}>{i18n.t('Value')}</span>
                <span className={classes.value}>{valueDescription}</span>
                <EditIcon />
            </button>
            {isModalOpen && (
                <CustomValueModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    )
}
