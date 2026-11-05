import { formatValue } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@modules/utils/guards'
import type { CurrentVisualization, MetadataStore } from '@types'

const getStandardRowCountText = (
    count: number,
    formattedCount: string,
    outputType: CurrentVisualization['outputType']
): string => {
    switch (outputType) {
        case 'ENROLLMENT':
            return i18n.t('{{- formattedCount}} enrollment', {
                count,
                formattedCount,
                defaultValue: '{{- formattedCount}} enrollment',
                defaultValue_plural: '{{- formattedCount}} enrollments',
            })
        case 'TRACKED_ENTITY_INSTANCE':
            return i18n.t('{{- formattedCount}} tracked entity', {
                count,
                formattedCount,
                defaultValue: '{{- formattedCount}} tracked entity',
                defaultValue_plural: '{{- formattedCount}} tracked entities',
            })
        case 'EVENT':
        default:
            return i18n.t('{{- formattedCount}} event', {
                count,
                formattedCount,
                defaultValue: '{{- formattedCount}} event',
                defaultValue_plural: '{{- formattedCount}} events',
            })
    }
}

const getPluralLabel = (
    visualization: CurrentVisualization,
    metadataStore: Pick<MetadataStore, 'getMetadataItem'>
): string | undefined => {
    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        const tetId = visualization.trackedEntityType?.id
        const tet = tetId ? metadataStore.getMetadataItem(tetId) : undefined

        return tet && 'displayTrackedEntityTypesLabel' in tet
            ? tet.displayTrackedEntityTypesLabel
            : undefined
    }

    const program = visualization.programDimensions?.[0]

    return visualization.outputType === 'ENROLLMENT'
        ? program?.displayEnrollmentsLabel
        : program?.displayEventsLabel
}

export const getRowCountText = (
    count: number,
    visualization: CurrentVisualization,
    metadataStore: Pick<MetadataStore, 'getMetadataItem'>
): string => {
    const formattedCount = formatValue(String(count), 'NUMBER', {
        digitGroupSeparator: visualization.digitGroupSeparator,
    })
    const pluralLabel = getPluralLabel(visualization, metadataStore)

    /* Programs and tracked entity types only have a custom plural label, so
     * a single row always uses the standard singular. */
    return count !== 1 && isPopulatedString(pluralLabel)
        ? `${formattedCount} ${pluralLabel}`
        : getStandardRowCountText(
              count,
              formattedCount,
              visualization.outputType
          )
}
