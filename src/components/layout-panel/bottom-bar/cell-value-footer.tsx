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
    getVisUiConfigCustomValueByOutputType,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/cell-value-footer.module.css'

/* Output types whose cells hold an aggregate, and so can show something other
 * than a plain count. */
const CHANGEABLE_OUTPUT_TYPES = ['EVENT', 'TRACKED_ENTITY_INSTANCE']

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

export const CellValueFooter: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValueByOutputType)[
        outputType
    ]
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programIds, tetId } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (
        visualizationType !== 'PIVOT_TABLE' ||
        isVisualizationEmpty(currentVis)
    ) {
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
                return trackedEntityName ?? i18n.t('Tracked entity')
            case 'ENROLLMENT':
                return isDataSourceProgramWithRegistration(program)
                    ? (program.displayEnrollmentLabel ?? i18n.t('Enrollment'))
                    : i18n.t('Enrollment')
            default:
                return isDataSourceProgramWithRegistration(program)
                    ? (program.displayEventLabel ?? i18n.t('Event'))
                    : i18n.t('Event')
        }
    })()

    const valueDescription = customValue
        ? `${customValueMetadata?.name} ${aggregationTypeDisplayNames[
              customValue.aggregationType
          ].toLocaleLowerCase()}`
        : i18n.t('{{- countedThing}} count', {
              countedThing,
              nsSeparator: '^^',
          })

    const label = i18n.t('Cells show {{- valueDescription}}', {
        valueDescription,
        nsSeparator: '^^',
    })

    const isClickable = CHANGEABLE_OUTPUT_TYPES.includes(outputType)

    const content = (
        <>
            <CellIcon />
            <span className={classes.label}>{label}</span>
        </>
    )

    return (
        <>
            {isClickable ? (
                <button
                    type="button"
                    className={cx(classes.footer, classes.clickable)}
                    onClick={() => setIsModalOpen(true)}
                >
                    {content}
                </button>
            ) : (
                <div className={classes.footer}>{content}</div>
            )}
            {isModalOpen && (
                <CustomValueModal
                    outputType={outputType}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
