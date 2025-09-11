import i18n from '@dhis2/d2-i18n'
import type { SupportedVisType } from '@constants/visualization-types'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import { isTimeDimensionId } from '@modules/dimension'
import type {
    DimensionId,
    CurrentVisualization,
    EmptyVisualization,
    NewVisualization,
    SavedVisualization,
} from '@types'

// TODO adjust the descriptions
// See: https://dhis2.atlassian.net/browse/DHIS2-19961
export const getVisTypeDescriptions = (): Record<SupportedVisType, string> => ({
    LINE_LIST: i18n.t(
        'Track or compare changes over time. Recommend period as category. (adjust for EVER)'
    ),
    PIVOT_TABLE: i18n.t(
        'View data and indicators in a manipulatable table. (adjust for EVER)'
    ),
})

export const headersMap: Record<DimensionId, string> = {
    ou: 'ouname',
    programStatus: 'programstatus',
    eventStatus: 'eventstatus',
    created: 'created',
    createdBy: 'createdbydisplayname',
    lastUpdatedBy: 'lastupdatedbydisplayname',
    eventDate: 'eventdate',
    enrollmentDate: 'enrollmentdate',
    incidentDate: 'incidentdate',
    scheduledDate: 'scheduleddate',
    lastUpdated: 'lastupdated',
}

export const getHeadersMap = ({
    showHierarchy,
}: CurrentVisualization): Record<DimensionId, string> => {
    const map = Object.assign({}, headersMap)

    if (showHierarchy) {
        map['ou'] = 'ounamehierarchy'
    }

    return map
}

export const dimensionMetadataPropMap: Record<string, string> = {
    dataElementDimensions: 'dataElement',
    attributeDimensions: 'attribute',
    programIndicatorDimensions: 'programIndicator',
    categoryDimensions: 'category',
    categoryOptionGroupSetDimensions: 'categoryOptionGroupSet',
    organisationUnitGroupSetDimensions: 'organisationUnitGroupSet',
    dataElementGroupSetDimensions: 'dataElementGroupSet',
}

export const getDimensionMetadataFields = (): Array<string> =>
    Object.entries(dimensionMetadataPropMap).map(
        ([listName, objectName]) => `${listName}[${objectName}[id,name]]`
    )

export const isVisualizationWithTimeDimension = (vis: CurrentVisualization) =>
    layoutGetAllDimensions(vis).some(
        ({ dimensionType, dimension, items }) =>
            (dimensionType === 'PERIOD' || isTimeDimensionId(dimension)) &&
            Array.isArray(items) &&
            items.length > 0
    )

// Type guards for CurrentVisualization union
export const isVisualizationEmpty = (
    visualization: CurrentVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

export const isVisualizationSaved = (
    visualization: CurrentVisualization
): visualization is SavedVisualization => {
    return 'id' in visualization && typeof visualization.id === 'string'
}

export const isVisualizationNew = (
    visualization: CurrentVisualization
): visualization is NewVisualization => {
    return (
        !isVisualizationEmpty(visualization) &&
        !isVisualizationSaved(visualization)
    )
}
