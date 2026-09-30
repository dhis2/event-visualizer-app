import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@modules/utils/guards'
import type { CurrentVisualization, MetadataStore } from '@types'

const getCountOrListTitle = (
    label: string,
    visualization: CurrentVisualization
): string =>
    visualization.type === 'PIVOT_TABLE'
        ? i18n.t('{{- label}} count', { label })
        : i18n.t('{{- label}} list', { label })

type VisualizationWithCustomValue = CurrentVisualization & {
    value: { id: string }
    aggregationType: NonNullable<CurrentVisualization['aggregationType']>
}

const hasCustomValue = (
    visualization: CurrentVisualization
): visualization is VisualizationWithCustomValue =>
    visualization.type === 'PIVOT_TABLE' &&
    Boolean(visualization.value?.id) &&
    Boolean(visualization.aggregationType)

const getCustomValueTitle = (
    visualization: VisualizationWithCustomValue,
    metadataStore: MetadataStore
): string => {
    const itemName = metadataStore.getMetadataItemOrThrow(
        visualization.value.id
    ).name
    const aggregationName =
        aggregationTypeDisplayNames[visualization.aggregationType]

    return `${itemName} · ${aggregationName}`
}

const getTrackedEntityTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string => {
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
        : i18n.t('Tracked entities')
}

export const getAutoTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string => {
    if (hasCustomValue(visualization)) {
        return getCustomValueTitle(visualization, metadataStore)
    }

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        return getTrackedEntityTitle(visualization, metadataStore)
    }

    const program = visualization.programDimensions?.[0]

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
