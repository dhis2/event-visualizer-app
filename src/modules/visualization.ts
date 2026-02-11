import i18n from '@dhis2/d2-i18n'
import deepEqual from 'deep-equal'
import { getConditionsFromVisualization } from './conditions'
import { isTimeDimensionId, transformDimensions } from './dimension'
import { getRepetitionsFromVisualisation } from './repetitions'
import { getRequestOptions } from '@components/plugin-wrapper/hooks/query-tools-common'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
    layoutGetAllDimensions,
} from '@dhis2/analytics'
import { initialState as currentVisDefaultValue } from '@store/current-vis-slice'
import { initialState as savedVisDefaultValue } from '@store/saved-vis-slice'
import type {
    DimensionArray,
    CurrentVisualization,
    DimensionId,
    EmptyVisualization,
    NewVisualization,
    SavedVisualization,
    VisualizationType,
    VisualizationState,
    SortDirection,
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
    completedDate: 'completeddate',
    created: 'created',
    createdBy: 'createdbydisplayname',
    createdDate: 'createddate',
    lastUpdatedBy: 'lastupdatedbydisplayname',
    lastUpdatedOn: 'lastupdatedon', // XXX: needed here? is this used also in LL?
    eventDate: 'eventdate',
    enrollmentDate: 'enrollmentdate',
    incidentDate: 'incidentdate',
    scheduledDate: 'scheduleddate',
    lastUpdated: 'lastupdated',
}

export const getHeadersMap = ({
    showHierarchy,
}: {
    showHierarchy?: boolean
}): Record<DimensionId, string> => {
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

    // destructuring here to avoid mutating the original value with delete
    const { completedOnly, orgUnitField, ...transformedVisualization } =
        visualization

    // convert completedOnly option to eventStatus = COMPLETED filter
    if (completedOnly && visualization.outputType === 'EVENT') {
        transformedFilters.push({
            dimension: 'eventStatus',
            items: [{ id: 'COMPLETED' }],
        })
    }

    // orgUnitField comes from legacy ER
    if (orgUnitField) {
        transformedFilters.push({
            dimension: 'ou',
            items: [{ id: orgUnitField }], // XXX: check this
        })
    }

    // timeField comes from legacy ER
    // Keep timeField for DE time dimensions, so it can be passed along in the analytics request
    // If instead it's a (normal) time dimension, remove the property as it is converted into a period dimension
    if (visualization.timeField && isTimeDimensionId(visualization.timeField)) {
        delete transformedVisualization.timeField
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

export const getVisualizationState = (
    savedVis: SavedVisualization | EmptyVisualization,
    currentVis: CurrentVisualization
): VisualizationState => {
    if (savedVis === savedVisDefaultValue) {
        return currentVis === currentVisDefaultValue ? 'EMPTY' : 'UNSAVED'
    } else if (deepEqual(savedVis, currentVis)) {
        return 'SAVED'
    } else {
        return 'DIRTY'
    }
}

const removeDimensionPropertiesBeforeSaving = (
    axis: DimensionArray | undefined
) => {
    return axis?.map((dim) => {
        const dimension = Object.assign({}, dim)
        const propsToRemove = ['dimensionType', 'valueType']

        propsToRemove.forEach((prop) => {
            delete dimension[prop]
        })

        return dimension
    })
}

const getDimensionIdFromHeaderName = (
    headerName: string,
    visualization: CurrentVisualization
) => {
    const headersMap = getHeadersMap(
        getRequestOptions(visualization) as unknown as CurrentVisualization
    )
    return Object.keys(headersMap).find((key) => headersMap[key] === headerName)
}

export const getSaveableVisualization = (
    vis: NewVisualization | SavedVisualization
): NewVisualization | SavedVisualization => {
    const visualization = Object.assign({}, vis)

    visualization.columns = removeDimensionPropertiesBeforeSaving(
        visualization.columns
    )
    visualization.filters = removeDimensionPropertiesBeforeSaving(
        visualization.filters
    )
    visualization.rows = removeDimensionPropertiesBeforeSaving(
        visualization.rows
    )

    if (!visualization.programStage?.id) {
        delete visualization.programStage
    }

    // Remove legacy property when saving
    delete visualization.legacy

    // Use the first sorting item only and format for saving
    visualization.sorting = vis.sorting?.length
        ? [
              {
                  dimension:
                      getDimensionIdFromHeaderName(
                          vis.sorting[0].dimension,
                          vis
                      ) || vis.sorting[0].dimension,
                  direction: vis.sorting[0].direction
                      ? (vis.sorting[0].direction.toUpperCase() as SortDirection)
                      : 'ASC',
              },
          ]
        : undefined

    return visualization
}

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

export const getVisualizationUiConfig = (vis: CurrentVisualization) => {
    const outputType = vis.outputType
    const layout = layoutGetAxisIdDimensionIdsObject(vis)

    return {
        visualizationType: vis.type,
        outputType,
        layout: {
            columns: layout.columns ?? [],
            filters: layout.filters ?? [],
            rows: layout.rows ?? [],
        },
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(vis, outputType),
        repetitionsByDimension: getRepetitionsFromVisualisation(vis),
    }
}
