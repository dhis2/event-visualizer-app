import i18n from '@dhis2/d2-i18n'
import deepEqual from 'deep-equal'
import { getRequestOptions } from '@components/plugin-wrapper/hooks/query-tools-common'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import { isTimeDimensionId, transformDimensions } from '@modules/dimension'
import { options } from '@modules/options'
import { initialState as currentVisDefaultValue } from '@store/current-vis-slice'
import { initialState as savedVisDefaultValue } from '@store/saved-vis-slice'
import type {
    DimensionId,
    CurrentVisualization,
    EmptyVisualization,
    NewVisualization,
    SavedVisualization,
    VisualizationType,
    VisualizationState,
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

const removeDimensionPropsBeforeSaving = (axis) =>
    axis?.map((dim) => {
        const dimension = Object.assign({}, dim)
        const props = ['dimensionType', 'valueType']

        props.forEach((prop) => {
            delete dimension[prop]
        })

        return dimension
    })
export const getDimensionIdFromHeaderName = (headerName, visualization) => {
    const headersMap = getHeadersMap(
        getRequestOptions(visualization) as unknown as CurrentVisualization
    )

    return Object.keys(headersMap).find((key) => headersMap[key] === headerName)
}

export const getSaveableVisualization = (vis) => {
    const visualization = Object.assign({}, vis)
    const nonSaveableOptions = Object.keys(options).filter(
        (option) => !options[option].saveable
    )

    nonSaveableOptions.forEach((option) => delete visualization[option])

    visualization.columns = removeDimensionPropsBeforeSaving(
        visualization.columns
    )
    visualization.filters = removeDimensionPropsBeforeSaving(
        visualization.filters
    )

    if (!visualization.programStage?.id) {
        delete visualization.programStage
    }

    // Remove legacy prop when saving a copy of an vis created with the Event Reports app
    delete visualization.legacy

    // format sorting
    visualization.sorting = vis.sorting?.length
        ? [
              {
                  dimension:
                      getDimensionIdFromHeaderName(
                          vis.sorting[0].dimension,
                          vis
                      ) || vis.sorting[0].dimension,
                  direction: vis.sorting[0].direction.toUpperCase(),
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
