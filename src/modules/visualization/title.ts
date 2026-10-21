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
    value: { id: string; name: string }
    aggregationType: NonNullable<CurrentVisualization['aggregationType']>
}

/* The name is required: without it there is nothing to title the table with,
 * so such a visualization falls through to the count title instead. */
const hasCustomValue = (
    visualization: CurrentVisualization
): visualization is VisualizationWithCustomValue =>
    visualization.type === 'PIVOT_TABLE' &&
    Boolean(visualization.value?.id) &&
    Boolean(visualization.value?.name) &&
    Boolean(visualization.aggregationType)

const getCustomValueTitle = (
    visualization: VisualizationWithCustomValue
): string => {
    const aggregationName =
        aggregationTypeDisplayNames[visualization.aggregationType]

    return `${visualization.value.name} · ${aggregationName}`
}

const getTrackedEntityTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string => {
    const tetId = visualization.trackedEntityType?.id
    if (!tetId) {
        throw new Error(
            'A tracked entity visualization has no tracked entity type'
        )
    }
    const tet = metadataStore.getMetadataItemOrThrow(tetId)
    const pluralLabel =
        'displayTrackedEntityTypesLabel' in tet
            ? tet.displayTrackedEntityTypesLabel
            : undefined

    return isPopulatedString(pluralLabel)
        ? pluralLabel
        : getCountOrListTitle(tet.name, visualization)
}

export const getAutoTitle = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): string => {
    if (hasCustomValue(visualization)) {
        return getCustomValueTitle(visualization)
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
