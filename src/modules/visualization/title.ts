import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@modules/utils/guards'
import type { CurrentVisualization, MetadataStore, Program } from '@types'

const getFirstProgramId = (
    visualization: CurrentVisualization
): string | undefined => {
    for (const axis of [
        visualization.columns,
        visualization.rows,
        visualization.filters,
    ]) {
        for (const dimension of axis ?? []) {
            if (dimension.program?.id) {
                return dimension.program.id
            }
        }
    }
    return undefined
}

const getCountOrListTitle = (
    label: string,
    visualization: CurrentVisualization
): string =>
    visualization.type === 'PIVOT_TABLE'
        ? i18n.t('{{- label}} count', { label })
        : i18n.t('{{- label}} list', { label })

const getCustomValueTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string | undefined => {
    if (
        visualization.type !== 'PIVOT_TABLE' ||
        !visualization.value?.id ||
        !visualization.aggregationType
    ) {
        return undefined
    }
    const itemName = metadataStore.getMetadataItem(visualization.value.id)?.name
    const aggregationName =
        aggregationTypeDisplayNames[visualization.aggregationType]

    return isPopulatedString(itemName) && isPopulatedString(aggregationName)
        ? `${itemName} · ${aggregationName}`
        : undefined
}

const getTrackedEntityTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string | undefined => {
    const tetId = visualization.trackedEntityType?.id
    const tet = tetId ? metadataStore.getMetadataItem(tetId) : undefined
    const pluralLabel =
        tet && 'displayTrackedEntityTypesLabel' in tet
            ? tet.displayTrackedEntityTypesLabel
            : undefined

    if (isPopulatedString(pluralLabel)) {
        return pluralLabel
    }
    return isPopulatedString(tet?.name)
        ? getCountOrListTitle(tet.name, visualization)
        : undefined
}

const getProgramLabels = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): Program | undefined => {
    const programId = getFirstProgramId(visualization)
    return programId
        ? metadataStore.getProgramMetadataItem(programId)
        : undefined
}

export const getAutoTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string | undefined => {
    const customValueTitle = getCustomValueTitle(visualization, metadataStore)
    if (customValueTitle) {
        return customValueTitle
    }

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        return getTrackedEntityTitle(visualization, metadataStore)
    }

    const program = getProgramLabels(visualization, metadataStore)

    if (visualization.outputType === 'ENROLLMENT') {
        if (isPopulatedString(program?.displayEnrollmentsLabel)) {
            return program.displayEnrollmentsLabel
        }
        if (isPopulatedString(program?.displayEnrollmentLabel)) {
            return getCountOrListTitle(
                program.displayEnrollmentLabel,
                visualization
            )
        }
        return i18n.t('Enrollments')
    }

    if (isPopulatedString(program?.displayEventsLabel)) {
        return program.displayEventsLabel
    }
    if (isPopulatedString(program?.displayEventLabel)) {
        return getCountOrListTitle(program.displayEventLabel, visualization)
    }
    return i18n.t('Events')
}

export const getVisualizationTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string | undefined => {
    if (visualization.hideTitle) {
        return undefined
    }
    if (isPopulatedString(visualization.title)) {
        return visualization.title
    }
    return getAutoTitle(visualization, metadataStore)
}
