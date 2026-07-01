import { DEFAULT_OPTIONS } from '@constants/options'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import { getHeadersMap } from '@modules/analytics-request'
import { getConditionsFromVisualization } from '@modules/conditions'
import {
    CONTEXTLESS_DIMENSION_TYPES,
    ENROLLMENT_SCOPED_DIMENSION_IDS,
    getCompoundDimensionId,
    META_DIMENSION_IDS,
    WIRE_ONLY_DIMENSIONS,
} from '@modules/dimension/ids'
import {
    isTimeDimensionId,
    KNOWN_TIME_FIELD_VALUES,
    outputTypeTimeDimensionMap,
    timeFieldTimeDimensionMap,
} from '@modules/dimension/time'
import { toAppLocalDimensions } from '@modules/dimension/translation'
import { getRepetitionsFromVisualisation } from '@modules/repetitions'
import type {
    ApiSavedVisualization,
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    DimensionRecord,
    EmptyVisualization,
    EventVisualizationOptions,
    OutputType,
    SavedVisualization,
    SortDirection,
    VisualizationState,
} from '@types'
import deepEqual from 'deep-equal'

const getProgramDimensionsCount = (
    visualization: CurrentVisualization | EmptyVisualization
): number => {
    if (!('programDimensions' in visualization)) {
        return 0
    }
    return visualization.programDimensions?.length ?? 0
}

const visualizationHasProgramId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => getProgramDimensionsCount(visualization) > 0

const visualizationHasTrackedEntityTypeId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => Boolean(visualization?.trackedEntityType?.id)

// Shape check: does the visualization carry the minimum fields required for
// the API to accept a save payload (POST or PUT)
export const isVisualizationPersistable = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean =>
    visualization.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? visualizationHasTrackedEntityTypeId(visualization)
        : visualizationHasProgramId(visualization)

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
        const dimension = { ...dim }
        const propsToRemove = ['dimensionType', 'valueType']

        propsToRemove.forEach((prop) => {
            delete dimension[prop as keyof DimensionRecord]
        })

        return dimension
    })
}

const getDimensionIdFromHeaderName = (
    headerName: string,
    visualization: CurrentVisualization
) =>
    Object.entries(getHeadersMap(visualization)).find(
        ([, value]) => value === headerName
    )?.[0]

export const getSaveableVisualization = (
    vis: SavedVisualization
): SavedVisualization => {
    const visualization = { ...vis }

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
    }
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

/* Old dimension IDs (created by the legacy event-visualizer / Event Reports
 * app) mapped onto the canonical IDs this app and the backend analytics API
 * use. `createdDate` is a genuine persisted alias of `created`; the other two
 * are normalised defensively (the backend never persists them). */
const LEGACY_DIMENSION_ID_RENAMES: Record<string, DimensionId> = {
    createdDate: 'created',
    completedDate: 'completed',
    lastUpdatedOn: 'lastUpdated',
}

/**
 * Legacy → canonical normalisation for saved visualizations received from the
 * eventVisualizations API. Converts the legacy shapes (old line-listing
 * `legacy: true`, old event-visualizer top-level program/programStage, and old
 * dimension IDs) into the canonical shape this app persists.
 *
 * Scope:
 * - Propagate top-level program/programStage onto individual dimensions
 * - Ensure `programDimensions` includes the top-level program
 * - Convert legacy `pe` dimension into the proper time dimension
 * - Rename old dimension IDs (`createdDate`/`completedDate`/`lastUpdatedOn`)
 *   to their canonical form
 * - Convert legacy `orgUnitField` into an `ou` filter
 * - Convert top-level `programStatus` into a `programStatus` filter dimension
 * - Drop `timeField` when it holds a known backend enum value (e.g.
 *   `EVENT_DATE`) — the corresponding "which column" information is now
 *   encoded in the concrete time dimension produced above, so leaving
 *   `timeField` would duplicate it. Preserve `timeField` when it holds a
 *   data-element / attribute UID, since that's still a live analytics
 *   parameter
 * - Drop top-level `program` and `programStage`
 * - Mark output as `legacy: true` whenever any of the above upgraded the
 *   persisted shape, so the vis cannot be overwritten in place — only "Save
 *   as" is allowed. Overwriting would silently persist in the canonical
 *   format, breaking older apps that still read the legacy shape.
 *
 * Out of scope (handled downstream — these run on every load, not just legacy
 * visualizations, so they do not imply the `legacy` flag):
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
        legacy: apiVisLegacy,
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

    // The vis is legacy whenever anything here upgrades the persisted shape:
    // re-saving in canonical format would then break older apps still reading
    // the original shape, so block the in-place save path. Seed it from the
    // top-level legacy signals (explicit flag, old event-visualizer
    // program/programStage, legacy `orgUnitField`/`programStatus` that get
    // converted to filter dimensions); the per-dimension pass and the
    // `timeField` drop below flip it too.
    let legacy =
        Boolean(apiVisLegacy) ||
        Boolean(program || programStage) ||
        Boolean(orgUnitField) ||
        Boolean(programStatus)

    /* Single pass per dimension, in order:
     *   - convert a legacy `pe` dimension into the concrete time dimension
     *     (legacy line-listing shape)
     *   - rename old dimension IDs to their canonical form
     *   - propagate top-level program/programStage onto dimensions that
     *     don't carry them (old event-visualizer shape), but only where it
     *     makes semantic sense — the rename runs first so meta dims renamed
     *     from a legacy ID (e.g. `createdDate` → `created`) are recognised
     *     as context-free here:
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
                    legacy = true
                }
            }

            const renamedDimension = LEGACY_DIMENSION_ID_RENAMES[out.dimension]
            if (renamedDimension) {
                out = { ...out, dimension: renamedDimension }
                legacy = true
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
    // request still needs). Dropping a known-enum `timeField` is an upgrade.
    const preserveTimeField =
        typeof timeField === 'string' && !KNOWN_TIME_FIELD_VALUES.has(timeField)
    if (typeof timeField === 'string' && !preserveTimeField) {
        legacy = true
    }

    return {
        ...rest,
        columns: normalizedColumns,
        rows: normalizedRows,
        filters: normalizedFilters,
        programDimensions: normalizedProgramDimensions,
        ...(preserveTimeField ? { timeField } : {}),
        ...(legacy ? { legacy: true } : {}),
        ...(sortOrder !== 0 && { sortOrder }),
        ...(topLimit !== 0 && { topLimit }),
    } as SavedVisualization
}
