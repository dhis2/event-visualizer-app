import { getRequestOptions } from '@components/plugin-wrapper/hooks/query-tools-common'
import { DEFAULT_OPTIONS } from '@constants/options'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import type { LastActiveButton } from '@store/vis-ui-config-slice'
import type {
    ApiSavedVisualization,
    DimensionArray,
    CurrentVisualization,
    DimensionId,
    EmptyVisualization,
    EventVisualizationOptions,
    OutputType,
    Program,
    ProgramStage,
    SavedVisualization,
    VisualizationType,
    VisualizationState,
    SortDirection,
} from '@types'
import deepEqual from 'deep-equal'
import { getConditionsFromVisualization } from './conditions'
import {
    CONTEXTLESS_DIMENSION_TYPES,
    ENROLLMENT_SCOPED_DIMENSION_IDS,
    getCompoundDimensionId,
    isTimeDimensionId,
    KNOWN_TIME_FIELD_VALUES,
    META_DIMENSION_IDS,
    outputTypeTimeDimensionMap,
    timeFieldTimeDimensionMap,
    toAppLocalDimensions,
    transformDimensions,
    WIRE_ONLY_DIMENSIONS,
} from './dimension'
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
    completed: 'completed',
    completedDate: 'completeddate',
    created: 'created',
    createdBy: 'createdbydisplayname',
    createdDate: 'createddate',
    lastUpdatedBy: 'lastupdatedbydisplayname',
    lastUpdatedOn: 'lastupdatedon', // XXX: needed here? is this used also in LL?
    eventDate: 'eventdate',
    enrollmentDate: 'enrollmentdate',
    enrollmentOu: 'enrollmentouname',
    incidentDate: 'incidentdate',
    scheduledDate: 'scheduleddate',
    lastUpdated: 'lastupdated',
}

export const getHeadersMap = (
    visualization: CurrentVisualization
): Record<DimensionId, string> => {
    const { outputType, showHierarchy, type } = visualization

    const map = Object.assign({}, headersMap)

    if (type === 'PIVOT_TABLE') {
        map['ou'] = 'ou'
        map['enrollmentOu'] = outputType === 'EVENT' ? 'enrollmentou' : 'ou'
    } else if (showHierarchy) {
        map['ou'] = 'ounamehierarchy'
    } else if (outputType === 'ENROLLMENT') {
        map['enrollmentOu'] = 'ouname'
    }

    return map
}

/* Dimension types whose values are not bound to any program or stage —
 * program indicators and tracked entity attributes are owned by a program
 * in the metadata model but their analytics IDs are plain (never carry
 * program/stage prefixes). Combined with CONTEXTLESS_DIMENSION_TYPES (eg.
 * organisation unit group sets), this is the set we must never decorate
 * with the legacy top-level program/programStage refs. */
const NO_CONTEXT_DIMENSION_TYPES: ReadonlySet<string> = new Set([
    'PROGRAM_INDICATOR',
    'PROGRAM_ATTRIBUTE',
    ...CONTEXTLESS_DIMENSION_TYPES,
])

/* Static reverse of headersMap. The ENR `enrollmentOu → ouname` override
 * is not reversed here — bare `ouname` is ambiguous (stage event OU vs
 * enrollment OU) and is disambiguated by prefix presence + outputType. */
const reversedHeadersMap: Record<string, string> = {
    ...Object.entries(headersMap).reduce<Record<string, string>>(
        (acc, [appLocal, wire]) => {
            acc[wire] = appLocal
            return acc
        },
        {}
    ),
    ounamehierarchy: 'ou',
}

/* Wire response header → canonical app-local dimension ID (store key). */
export const analyticsHeaderToCanonicalDimensionId = (
    headerName: string,
    visualization: CurrentVisualization
): string => {
    const { outputType } = visualization

    const lastDotIndex = headerName.lastIndexOf('.')
    const prefix =
        lastDotIndex === -1 ? undefined : headerName.slice(0, lastDotIndex)
    const wireDim =
        lastDotIndex === -1 ? headerName : headerName.slice(lastDotIndex + 1)

    const appLocalDim = reversedHeadersMap[wireDim] ?? wireDim

    if (prefix) {
        return `${prefix}.${appLocalDim}`
    }

    if (outputType === 'TRACKED_ENTITY_INSTANCE') {
        const tetId = visualization.trackedEntityType?.id
        if (tetId && appLocalDim === 'ou') {
            return `${tetId}.enrollmentOu`
        }
        return appLocalDim
    }

    const programId = visualization.programDimensions?.[0]?.id

    if (outputType === 'ENROLLMENT' && appLocalDim === 'ou' && programId) {
        return `${programId}.enrollmentOu`
    }

    if (ENROLLMENT_SCOPED_DIMENSION_IDS.has(appLocalDim) && programId) {
        return `${programId}.${appLocalDim}`
    }

    return appLocalDim
}

/* Built-in dimension IDs sent in the analytics request `dimension=` param
 * as SCREAMING_SNAKE_CASE. Everything else (UIDs, `ou`) goes verbatim. */
const SCREAMING_SNAKE_REQUEST_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'eventDate',
    'scheduledDate',
    'eventStatus',
    'enrollmentOu',
    'enrollmentDate',
    'incidentDate',
    'programStatus',
    'lastUpdated',
    'created',
    'completed',
])

const toRequestDimensionWireName = (dimensionId: string): string =>
    SCREAMING_SNAKE_REQUEST_DIMENSION_IDS.has(dimensionId)
        ? dimensionId.replaceAll(/[A-Z]/g, (c) => `_${c}`).toUpperCase()
        : dimensionId

type DimensionContext = {
    dimensionId: string
    programId?: string
    programStageId?: string
    trackedEntityTypeId?: string
}

/* Canonical dimension → analytics request `?dimension=` wire string. */
export const getAnalyticsRequestDimensionName = ({
    dimensionId,
    programId,
    programStageId,
    trackedEntityTypeId,
    outputType,
}: DimensionContext & { outputType: OutputType }): string => {
    if (programStageId) {
        return `${programStageId}.${toRequestDimensionWireName(dimensionId)}`
    }

    if (trackedEntityTypeId && !programId) {
        if (dimensionId === 'enrollmentOu') {
            return 'ou'
        }
        return toRequestDimensionWireName(dimensionId)
    }

    if (programId && outputType === 'TRACKED_ENTITY_INSTANCE') {
        return `${programId}.${toRequestDimensionWireName(dimensionId)}`
    }

    if (outputType === 'ENROLLMENT' && dimensionId === 'enrollmentOu') {
        return 'ou'
    }

    return toRequestDimensionWireName(dimensionId)
}

/* Canonical dimension → analytics request `?headers=` wire string, which
 * the engine echoes back as the response header `name`. Same prefix rules
 * as getAnalyticsRequestDimensionName; dim name comes from getHeadersMap. */
export const getAnalyticsRequestHeaderName = ({
    dimensionId,
    programId,
    programStageId,
    trackedEntityTypeId,
    visualization,
}: DimensionContext & {
    visualization: CurrentVisualization
}): string => {
    const { outputType } = visualization
    const map = getHeadersMap(visualization)
    const wireDim = map[dimensionId] ?? dimensionId

    if (programStageId) {
        return `${programStageId}.${wireDim}`
    }

    if (trackedEntityTypeId && !programId) {
        if (dimensionId === 'enrollmentOu') {
            return 'ouname'
        }
        return wireDim
    }

    if (programId && outputType === 'TRACKED_ENTITY_INSTANCE') {
        return `${programId}.${wireDim}`
    }

    return wireDim
}

/**
 * Transforms a canonical CurrentVisualization into the shape needed for
 * analytics requests and rendering. Applies wire-to-app dimension transforms
 * (PROGRAM_DATA_ELEMENT → DATA_ELEMENT, strip dy/latitude/longitude) and
 * converts the completedOnly option into an eventStatus filter.
 *
 * Legacy normalisation (pe → time dim, orgUnitField, timeField, top-level
 * program/programStage) is NOT this function's concern — that's handled
 * upstream by normalizeApiSavedVisualization at load time.
 */
export const transformVisualizationForAnalyticsRequest = (
    visualization: CurrentVisualization
): CurrentVisualization => {
    const columns = toAppLocalDimensions(
        transformDimensions(visualization.columns ?? [])
    )
    const rows = toAppLocalDimensions(
        transformDimensions(visualization.rows ?? [])
    )
    const filters = toAppLocalDimensions(
        transformDimensions(visualization.filters ?? [])
    )

    if (visualization.completedOnly && visualization.outputType === 'EVENT') {
        filters.push({
            dimension: 'eventStatus',
            items: [{ id: 'COMPLETED' }],
        })
    }

    return {
        ...visualization,
        columns,
        rows,
        filters,
    }
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
    'attributeDimensions',
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
        ...visualization,
        sorting,
    }
    // Remove legacy flag when saving — a legacy-loaded vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}

export const isVisualizationEmpty = (
    visualization:
        | CurrentVisualization
        | SavedVisualization
        | EmptyVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

// Structural check for the minimal fields shared by CurrentVisualization and
// SavedVisualization. Declaring the return as the union lets TypeScript
// narrow each slice input to its specific member (Empty is excluded either
// way), so we get useful narrowing in both currentVis and savedVis contexts
// without resorting to overloads.
const isPopulatedVisualization = (
    visualization:
        | CurrentVisualization
        | SavedVisualization
        | EmptyVisualization
): visualization is SavedVisualization | CurrentVisualization => {
    const candidate = visualization as Partial<CurrentVisualization>
    return (
        typeof candidate.type === 'string' &&
        Array.isArray(candidate.columns) &&
        Array.isArray(candidate.rows) &&
        Array.isArray(candidate.filters)
    )
}

export const isSavedVisualization = (
    visualization: SavedVisualization | EmptyVisualization
): visualization is SavedVisualization =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id === 'string' &&
    // `access` is SavedVisualization-only: CurrentVisualization doesn't carry
    // it, so its presence distinguishes a full saved vis from a persisted
    // currentVis that merely has an id.
    'access' in visualization

export const isCurrentVisualizationPersisted = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is CurrentVisualization & { id: string } =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id === 'string'

export const isCurrentVisualizationNew = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is CurrentVisualization =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id !== 'string'

const toAppLocalAxes = (dims: DimensionArray): DimensionArray =>
    toAppLocalDimensions(
        dims.filter((dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension))
    )

const OPTION_KEYS = Object.keys(DEFAULT_OPTIONS) as Array<
    keyof EventVisualizationOptions
>

const extractOptions = (
    vis: CurrentVisualization
): Partial<EventVisualizationOptions> => {
    const extracted: Partial<EventVisualizationOptions> = {}
    for (const key of OPTION_KEYS) {
        if (vis[key] !== undefined) {
            ;(extracted as Record<string, unknown>)[key] = vis[key]
        }
    }
    return extracted
}

export const getVisualizationUiConfig = (
    raw: CurrentVisualization,
    baseOptions: EventVisualizationOptions = DEFAULT_OPTIONS
) => {
    const vis: CurrentVisualization = {
        ...raw,
        columns: toAppLocalAxes(raw.columns ?? []),
        rows: toAppLocalAxes(raw.rows ?? []),
        filters: toAppLocalAxes(raw.filters ?? []),
    }
    const outputType = vis.outputType
    const tetId = vis.trackedEntityType?.id
    const toDimId = (dim: DimensionArray[number]) =>
        getCompoundDimensionId(dim, outputType, tetId)
    let lastActiveButton: LastActiveButton | undefined
    if (outputType === 'EVENT') {
        lastActiveButton = vis.value?.id ? 'CUSTOM_VALUE' : 'EVENT'
    }

    return {
        visualizationType: vis.type,
        outputType,
        layout: {
            columns: (vis.columns ?? []).map(toDimId),
            filters: (vis.filters ?? []).map(toDimId),
            rows: (vis.rows ?? []).map(toDimId),
        },
        itemsByDimension: [
            ...(vis.columns ?? []),
            ...(vis.rows ?? []),
            ...(vis.filters ?? []),
        ].reduce(
            (obj, dim) => {
                obj[toDimId(dim)] = (dim.items ?? [])
                    .map((item) => item.id)
                    .filter(Boolean) as string[]
                return obj
            },
            {} as Record<string, string[]>
        ),
        conditionsByDimension: getConditionsFromVisualization(vis, outputType),
        repetitionsByDimension: getRepetitionsFromVisualisation(vis),
        options: { ...baseOptions, ...extractOptions(vis) },
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

/**
 * Legacy → canonical normalisation for saved visualizations received from the
 * eventVisualizations API. Converts either of the two legacy shapes (old
 * line-listing `legacy: true`, and old event-visualizer top-level
 * program/programStage) into the canonical shape this app persists.
 *
 * Scope:
 * - Propagate top-level program/programStage onto individual dimensions
 * - Ensure `programDimensions` includes the top-level program
 * - Convert legacy `pe` dimension into the proper time dimension
 * - Convert legacy `orgUnitField` into an `ou` filter
 * - Drop `timeField` when it holds a known backend enum value (e.g.
 *   `EVENT_DATE`) — the corresponding "which column" information is now
 *   encoded in the concrete time dimension produced above, so leaving
 *   `timeField` would duplicate it. Preserve `timeField` when it holds a
 *   data-element / attribute UID, since that's still a live analytics
 *   parameter
 * - Drop top-level `program` and `programStage`
 * - Convert top-level `programStatus` into a `programStatus` filter dimension
 * - Mark output as `legacy: true` when either legacy shape was detected, so
 *   the vis cannot be overwritten in place — only "Save as" is allowed.
 *   Overwriting would silently persist in the canonical format, breaking
 *   older apps that still read the legacy shape.
 *
 * Out of scope (handled downstream):
 * - `completedOnly` → `eventStatus=COMPLETED` filter (not legacy-only)
 * - `PROGRAM_DATA_ELEMENT` → `DATA_ELEMENT` (wire → app shape)
 * - `dy`/`latitude`/`longitude` stripping (wire → app shape)
 */
export const normalizeApiSavedVisualization = (
    apiVis: ApiSavedVisualization
): SavedVisualization => {
    const {
        program,
        programStage,
        orgUnitField,
        timeField,
        legacy,
        programStatus,
        columns = [],
        rows = [],
        filters = [],
        programDimensions = [],
        sortOrder,
        topLimit,
        ...rest
    } = apiVis

    const programRef = program ? { id: program.id } : undefined
    const stageRef = programStage ? { id: programStage.id } : undefined
    const outputType = rest.outputType as OutputType | undefined

    /* Single pass per dimension:
     *   - convert a legacy `pe` dimension into the concrete time dimension
     *     (legacy line-listing shape) — done first so the scope guards
     *     below evaluate the final dimension ID
     *   - propagate top-level program/programStage onto dimensions that
     *     don't carry them (old event-visualizer shape), but only where it
     *     makes semantic sense:
     *       · meta dims, contextless dim types, program indicators and
     *         tracked entity attributes don't carry program/stage context
     *       · enrollment-scoped IDs are tied to the program, not a stage,
     *         so they get program only, never programStage */
    const normalizeDimensions = (dims: DimensionArray): DimensionArray =>
        dims.map((dim) => {
            let out = dim

            if (out.dimension === 'pe') {
                const targetDim =
                    (timeField && timeFieldTimeDimensionMap[timeField]) ||
                    (outputType && outputTypeTimeDimensionMap[outputType])
                if (targetDim) {
                    out = {
                        ...out,
                        dimension: targetDim,
                        dimensionType: 'PERIOD',
                    }
                }
            }

            const skipBothRefs =
                META_DIMENSION_IDS.has(out.dimension) ||
                (typeof out.dimensionType === 'string' &&
                    NO_CONTEXT_DIMENSION_TYPES.has(out.dimensionType))

            if (skipBothRefs) {
                return out
            }

            const skipStageRef = ENROLLMENT_SCOPED_DIMENSION_IDS.has(
                out.dimension
            )

            if (programRef && !out.program) {
                out = { ...out, program: programRef }
            }
            if (!skipStageRef && stageRef && !out.programStage) {
                out = { ...out, programStage: stageRef }
            }

            return out
        })

    const rawFilters = [
        ...filters,
        ...(orgUnitField
            ? [{ dimension: 'ou', items: [{ id: orgUnitField }] }]
            : []),
        ...(programStatus
            ? [{ dimension: 'programStatus', items: [{ id: programStatus }] }]
            : []),
    ]

    const normalizedColumns = normalizeDimensions(columns)
    const normalizedRows = normalizeDimensions(rows)
    const normalizedFilters = normalizeDimensions(rawFilters)

    const normalizedProgramDimensions =
        program && !programDimensions.some((p) => p.id === program.id)
            ? [...programDimensions, program]
            : programDimensions

    // `timeField` holding a known backend enum value has been materialised
    // into a concrete time dimension above; keep it only when it holds a
    // data-element / attribute UID (non-legacy usage that the analytics
    // request still needs).
    const preserveTimeField =
        typeof timeField === 'string' && !KNOWN_TIME_FIELD_VALUES.has(timeField)

    // Detect either legacy shape — shape-1 carried an explicit `legacy: true`
    // flag; shape-2 didn't, but having top-level program/programStage is the
    // tell. In both cases, re-saving in canonical format would break older
    // apps still reading the legacy shape, so block the save path.
    const markLegacy = Boolean(legacy || program || programStage)

    return {
        ...rest,
        columns: normalizedColumns,
        rows: normalizedRows,
        filters: normalizedFilters,
        programDimensions: normalizedProgramDimensions,
        ...(preserveTimeField ? { timeField } : {}),
        ...(markLegacy ? { legacy: true } : {}),
        ...(sortOrder !== 0 && { sortOrder }),
        ...(topLimit !== 0 && { topLimit }),
    } as SavedVisualization
}
