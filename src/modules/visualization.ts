import i18n from '@dhis2/d2-i18n'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
    layoutGetAllDimensions,
} from '@dhis2/analytics'
import {
    getFullDimensionId,
    isTimeDimensionId,
    transformDimensions,
} from '@modules/dimension'
import type {
    CurrentVisualization,
    DimensionId,
    EmptyVisualization,
    InputType,
    NewVisualization,
    SavedVisualization,
    VisualizationType,
} from '@types'

// TODO: adjust the descriptions
// See: https://dhis2.atlassian.net/browse/DHIS2-19961
export const getVisTypeDescriptions = (): Record<
    VisualizationType,
    string
> => ({
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

export const transformVisualization = (
    visualization: CurrentVisualization
): CurrentVisualization => {
    const transformedColumns = transformDimensions(
        visualization.columns ?? [],
        visualization
    )
    const transformedRows = transformDimensions(
        visualization.rows ?? [],
        visualization
    )
    const transformedFilters = transformDimensions(
        visualization.filters ?? [],
        visualization
    )

    // convert completedOnly option to eventStatus = COMPLETED filter
    // destructuring here to avoid mutating the original value with delete
    const { completedOnly, ...transformedVisualization } = visualization

    if (completedOnly && visualization.outputType === 'EVENT') {
        transformedFilters.push({
            dimension: 'eventStatus',
            items: [{ id: 'COMPLETED' }],
        })
    }

    return {
        ...transformedVisualization,
        columns: transformedColumns,
        rows: transformedRows,
        filters: transformedFilters,
    } as CurrentVisualization
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

const getConditionsFromVisualization = (
    vis: CurrentVisualization,
    inputType: InputType
): Record<string, { condition?: string; legendSet?: string }> => {
    const result: Record<string, { condition?: string; legendSet?: string }> =
        {}

    const columns = vis.columns ?? []
    const rows = vis.rows ?? []
    const filters = vis.filters ?? []

    const items = [...columns, ...rows, ...filters].filter(
        (item) => item.filter || item.legendSet
    )

    for (const item of items) {
        const dimensionId = getFullDimensionId({
            dimensionId: item.dimension,
            programId: item.program?.id,
            programStageId: item.programStage?.id,
            inputType,
        })
        result[dimensionId] = {
            condition: item.filter,
            legendSet: item.legendSet?.id,
        }
    }

    return result
}

const getVisualizationLayout = (layout, type: VisualizationType) => {
    if (type === 'LINE_LIST') {
        return {
            columns: [...layout.columns, ...(layout.rows || [])],
            rows: [],
            filters: [...layout.filters],
        }
    }

    return layout
}

export const getVisualizationUiConfig = (vis: CurrentVisualization) => {
    const inputType = vis.outputType // The single location where outputType is renamed to inputType

    return {
        visualizationType: vis.type,
        inputType,
        layout: getVisualizationLayout(
            layoutGetAxisIdDimensionIdsObject(vis),
            vis.type
        ),
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(vis, inputType),
    }
}
