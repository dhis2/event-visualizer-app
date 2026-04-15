import { getRequestOptions } from '@components/plugin-wrapper/hooks/query-tools-common'
import { DEFAULT_OPTIONS } from '@constants/options'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
    layoutGetAllDimensions,
} from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import type { LastActiveButton } from '@store/vis-ui-config-slice'
import type {
    DimensionArray,
    CurrentVisualization,
    DimensionId,
    EmptyVisualization,
    EventVisualizationOptions,
    Program,
    ProgramStage,
    SavedVisualization,
    VisualizationType,
    VisualizationState,
    SortDirection,
} from '@types'
import deepEqual from 'deep-equal'
import { getConditionsFromVisualization } from './conditions'
import { isTimeDimensionId, transformDimensions } from './dimension'
import { getRepetitionsFromVisualisation } from './repetitions'

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

// Keys on CurrentVisualization that are NOT part of EventVisualizationOptions.
// Combined with the option keys (derived from DEFAULT_OPTIONS below) this
// gives the full set of CurrentVisualization keys at runtime.
const CURRENT_VIS_NON_OPTION_KEYS: ReadonlyArray<
    Exclude<keyof CurrentVisualization, keyof EventVisualizationOptions>
> = [
    'type',
    'outputType',
    'columns',
    'rows',
    'filters',
    'trackedEntityType',
    'sorting',
    'value',
    'id',
    'programDimensions',
]

const CURRENT_VIS_KEYS: ReadonlyArray<keyof CurrentVisualization> = [
    ...CURRENT_VIS_NON_OPTION_KEYS,
    ...(Object.keys(DEFAULT_OPTIONS) as Array<keyof EventVisualizationOptions>),
]

/**
 * Extracts the CurrentVisualization-shaped subset of a SavedVisualization.
 * Used to compare a saved visualization to the current (edited) one —
 * the current vis is already in CurrentVisualization shape, but the saved
 * vis carries extra fields (access, createdBy, …) that we don't care about
 * when determining whether there are unsaved changes.
 */
export const toCurrentVis = (
    savedVis: SavedVisualization
): CurrentVisualization => {
    const result: Record<string, unknown> = {}
    for (const key of CURRENT_VIS_KEYS) {
        if (savedVis[key] !== undefined) {
            result[key] = savedVis[key]
        }
    }
    return result as CurrentVisualization
}

export const getVisualizationState = (
    savedVis: SavedVisualization | EmptyVisualization,
    currentVis: CurrentVisualization | EmptyVisualization
): VisualizationState => {
    if (isVisualizationEmpty(savedVis)) {
        return isVisualizationEmpty(currentVis) ? 'EMPTY' : 'UNSAVED'
    } else if (isVisualizationEmpty(currentVis)) {
        return 'DIRTY'
    } else if (deepEqual(toCurrentVis(savedVis), currentVis)) {
        return 'SAVED'
    } else {
        return 'DIRTY'
    }
}

const removeDimensionPropertiesBeforeSaving = (
    axis: DimensionArray
): DimensionArray => {
    return axis.map((dim) => {
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
    // TODO: revisit param type — this function accesses SavedVisualization fields
    // (programStage, legacy, sorting) but callers pass CurrentVisualization with casts
    vis: SavedVisualization
): SavedVisualization => {
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

    const { programStage, ...rest } = visualization

    // Use the first sorting item only and format for saving
    const sorting = vis.sorting?.length
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

    const result: Partial<SavedVisualization> = {
        ...rest,
        ...(programStage?.id ? { programStage } : {}),
        sorting,
    }
    // Remove legacy flag when saving — a legacy-loaded vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}

export const isVisualizationEmpty = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

export const isVisualizationSaved = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is SavedVisualization =>
    'id' in visualization && typeof visualization.id === 'string'

export const isVisualizationNew = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean =>
    !isVisualizationEmpty(visualization) && !isVisualizationSaved(visualization)

export const getVisualizationUiConfig = (vis: CurrentVisualization) => {
    const outputType = vis.outputType
    const layout = layoutGetAxisIdDimensionIdsObject(vis)
    let lastActiveButton: LastActiveButton | undefined
    if (outputType === 'EVENT') {
        lastActiveButton = vis.value?.id ? 'CUSTOM_VALUE' : 'EVENT'
    }

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
        ...(vis.value?.id && {
            customValue: {
                id: vis.value.id,
                aggregationType: vis.aggregationType || 'DEFAULT',
            },
        }),
        lastActiveButton,
    }
}

export const getSingleProgramFromVisualization = (
    visualization: CurrentVisualization
): Program => {
    const programs = visualization.programDimensions ?? []
    if (programs.length !== 1) {
        throw new Error(
            `Expected exactly one program in programDimensions, found ${programs.length}`
        )
    }
    return programs[0]
}

export const getSingleProgramStageFromVisualization = (
    visualization: CurrentVisualization
): ProgramStage => {
    const program = getSingleProgramFromVisualization(visualization)
    const stages = program.programStages ?? []
    if (stages.length !== 1) {
        throw new Error(
            `Expected exactly one stage on program ${program.id}, found ${stages.length}`
        )
    }
    return stages[0]
}
