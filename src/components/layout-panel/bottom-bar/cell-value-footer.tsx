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
import {
    getVisUiConfigCustomValue,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/cell-value-footer.module.css'

const CellIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M5 6H3v1h2V6Zm1 0h2v1H6V6ZM5 9H3v1h2V9Zm1 0h2v1H6V9Zm-1 3H3v1h2v-1Zm1 0h2v1H6v-1Zm7-6H9v1h4V6ZM9 9h4v1H9V9Zm4 3H9v1h4v-1Z" />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2Zm0 3V2h12v2H2Zm0 1h12v9H2V5Z"
        />
    </svg>
)

const EditIcon: FC = () => (
    <svg
        className={classes.editIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2.293a1 1 0 0 1 1.414 0l2.293 2.293a1 1 0 0 1 0 1.414l-7 7H11v1H2v-3.707l8-8Zm-7 8.414V13h2.293l5.5-5.5L8.5 5.207l-5.5 5.5ZM9.207 4.5 11.5 6.793l1.5-1.5L10.707 3l-1.5 1.5Z"
        />
        <path d="M14 14h-2v-1h2v1Z" />
    </svg>
)

export const CellValueFooter: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programIds, tetId } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (isVisualizationEmpty(currentVis)) {
        return null
    }

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

    const label = isLineList
        ? i18n.t('One row for each {{- countedThing}}', {
              countedThing,
              nsSeparator: '^^',
          })
        : i18n.t('Cells show {{- valueDescription}}', {
              valueDescription: customValue
                  ? `${customValueMetadata?.name} ${aggregationTypeDisplayNames[
                        customValue.aggregationType
                    ].toLocaleLowerCase()}`
                  : i18n.t('{{- countedThing}} count', {
                        countedThing,
                        nsSeparator: '^^',
                    }),
              nsSeparator: '^^',
          })

    const isClickable = !isLineList

    const content = (
        <>
            <CellIcon />
            <span className={classes.label}>{label}</span>
            {isClickable && <EditIcon />}
        </>
    )

    return (
        <>
            {isClickable ? (
                <button
                    type="button"
                    className={cx(classes.footer, classes.clickable, {
                        [classes.custom]: Boolean(customValue),
                    })}
                    onClick={() => setIsModalOpen(true)}
                >
                    {content}
                </button>
            ) : (
                <div className={classes.footer}>{content}</div>
            )}
            {isModalOpen && (
                <CustomValueModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    )
}
