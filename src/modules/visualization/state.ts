import { AXES } from '@constants/axis'
import { DEFAULT_OPTIONS } from '@constants/options'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import { getHeadersMap } from '@modules/analytics-request'
import { getConditionsFromVisualization } from '@modules/conditions'
import { dropInvalidGrouping } from '@modules/dimension/grouping'
import {
    CONTEXTLESS_DIMENSION_TYPES,
    ENROLLMENT_SCOPED_DIMENSION_IDS,
    getCompoundDimensionId,
    META_DIMENSION_IDS,
    DROPPED_LEGACY_DIMENSIONS,
} from '@modules/dimension/ids'
import {
    isTimeDimensionId,
    KNOWN_TIME_FIELD_VALUES,
    outputTypeTimeDimensionMap,
    timeFieldTimeDimensionMap,
} from '@modules/dimension/time'
import {
    toAppLocalDimensions,
    toEventVisualizationDimensionId,
} from '@modules/dimension/translation'
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
    VisualizationType,
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
 * The CurrentVisualization-shaped subset of a SavedVisualization. The API
 * returns fields the app never edits (access, createdBy, …); only the editable
 * subset belongs in current-vis state. Values are copied as they are — a field
 * the API left out stays out, rather than becoming an explicit undefined.
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

/* Rebuilt from the layout's dimensions rather than edited directly, so a real
 * change to any of them already shows up in the axis comparison. Comparing
 * them as well would only add false positives: the backend recomputes
 * programDimensions on every GET, in its own order, and returns more per entry
 * than the app can rebuild from the metadata store. */
const DERIVED_LAYOUT_FIELDS: ReadonlySet<string> = new Set([
    'trackedEntityType',
    'attributeDimensions',
    'programDimensions',
])

const DIMENSION_AXES = new Set<string>(AXES)

/* An option left out and an option set to its own default mean the same thing. */
export const isDefaultOptionValue = (key: string, value: unknown): boolean =>
    value === undefined ||
    deepEqual(value, (DEFAULT_OPTIONS as Record<string, unknown>)[key])

/* Not persisted, so they are stripped before saving — and comparing them would
 * report a false positive anyway: a loaded visualization carries the API's
 * dimensionType (PROGRAM_DATA_ELEMENT) where one rebuilt from visUiConfig
 * carries the metadata store's (DATA_ELEMENT). */
const NON_PERSISTED_DIMENSION_PROPERTIES: ReadonlyArray<keyof DimensionRecord> =
    ['dimensionType', 'valueType']

const removeNonPersistedDimensionProperties = (
    axis: DimensionArray
): DimensionArray =>
    axis.map((dim) => {
        const dimension = { ...dim }

        NON_PERSISTED_DIMENSION_PROPERTIES.forEach((property) => {
            delete dimension[property]
        })

        return dimension
    })

/* The API returns more per dimension than the app can rebuild from visUiConfig,
 * and none of that extra detail is an edit: option sets and legend sets come
 * back with their display name, and a repetition comes back with the dimension,
 * axis and program context the backend derives from the dimension owning it.
 * Reducing both sides to what the app itself can produce leaves only real
 * edits. */
const comparableAxis = (axis: DimensionArray = []): DimensionArray =>
    removeNonPersistedDimensionProperties(axis).map((dim) => {
        const comparableDim = { ...dim }

        // No items and an empty items array both mean "no selection".
        if (Array.isArray(comparableDim.items) && !comparableDim.items.length) {
            delete comparableDim.items
        }
        if (comparableDim.optionSet) {
            comparableDim.optionSet = { id: comparableDim.optionSet.id }
        }
        if (comparableDim.legendSet) {
            comparableDim.legendSet = { id: comparableDim.legendSet.id }
        }
        if (comparableDim.repetition) {
            comparableDim.repetition = {
                indexes: comparableDim.repetition.indexes,
            }
        }
        return comparableDim
    })

const idOnly = (ref: unknown): unknown =>
    ref && typeof ref === 'object' && 'id' in ref
        ? { id: (ref as { id: string }).id }
        : ref

const isFieldEquivalent = (key: string, a: unknown, b: unknown): boolean => {
    /* The custom value: the API returns it with a display name and an
     * aggregation type, where visUiConfig holds nothing but the id. */
    if (key === 'value') {
        return deepEqual(idOnly(a), idOnly(b))
    }

    if (key in DEFAULT_OPTIONS) {
        const bothAtDefault =
            isDefaultOptionValue(key, a) && isDefaultOptionValue(key, b)

        return bothAtDefault || deepEqual(a, b)
    }

    if (DIMENSION_AXES.has(key)) {
        return deepEqual(
            comparableAxis(a as DimensionArray),
            comparableAxis(b as DimensionArray)
        )
    }

    if (DERIVED_LAYOUT_FIELDS.has(key)) {
        return true
    }

    return deepEqual(a, b)
}

/* Only the keys present on `completeVisualization` are compared, so it has to
 * carry the full CurrentVisualization key set: a key missing there is a key
 * that goes unchecked. */
export const areVisualizationsEquivalent = (
    visualization: CurrentVisualization | EmptyVisualization,
    completeVisualization: CurrentVisualization
): boolean => {
    const a = visualization as Record<string, unknown>
    const b = completeVisualization as Record<string, unknown>

    return Object.keys(b).every((key) => isFieldEquivalent(key, a[key], b[key]))
}

export const getVisualizationState = (
    savedVis: SavedVisualization | EmptyVisualization,
    currentVis: CurrentVisualization | EmptyVisualization
): VisualizationState => {
    if (isVisualizationEmpty(savedVis)) {
        return isVisualizationEmpty(currentVis) ? 'EMPTY' : 'UNSAVED'
    } else if (isVisualizationEmpty(currentVis)) {
        return 'DIRTY'
    } else if (
        areVisualizationsEquivalent(toCurrentVis(savedVis), currentVis)
    ) {
        return 'SAVED'
    } else {
        return 'DIRTY'
    }
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

    visualization.columns = removeNonPersistedDimensionProperties(
        visualization.columns
    )
    visualization.filters = removeNonPersistedDimensionProperties(
        visualization.filters
    )
    visualization.rows = removeNonPersistedDimensionProperties(
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
        CurrentVisualization | SavedVisualization | EmptyVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

// Structural check for the minimal fields shared by CurrentVisualization and
// SavedVisualization. Declaring the return as the union lets TypeScript
// narrow each slice input to its specific member (Empty is excluded either
// way), so we get useful narrowing in both currentVis and savedVis contexts
// without resorting to overloads.
const isPopulatedVisualization = (
    visualization:
        CurrentVisualization | SavedVisualization | EmptyVisualization
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
        dims.filter((dim) => !DROPPED_LEGACY_DIMENSIONS.has(dim.dimension))
    )

const OPTION_KEYS = Object.keys(DEFAULT_OPTIONS) as Array<
    keyof EventVisualizationOptions
>

const extractOptions = (
    vis: CurrentVisualization
): Partial<EventVisualizationOptions> => {
    const extracted: Record<string, unknown> = {}
    for (const key of OPTION_KEYS) {
        if (vis[key] !== undefined) {
            extracted[key] = vis[key]
        }
    }
    return extracted as Partial<EventVisualizationOptions>
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

/* The top-level source context the per-dimension steps read while normalising.
 * It is not part of the output vis — the legacy top-level program/programStage
 * and timeField are consumed here and dropped from the result. */
type LegacyDimensionContext = {
    outputType: OutputType | undefined
    visualizationType: VisualizationType
    timeField: string | undefined
    programRef: { id: string } | undefined
    stageRef: { id: string } | undefined
}

// Legacy line-listing stored the period as a bare `pe`; turn it into the
// concrete time dimension the app uses.
const materializeLegacyPeDimension = (
    dim: DimensionRecord,
    context: LegacyDimensionContext,
    vis: SavedVisualization
): DimensionRecord => {
    if (dim.dimension !== 'pe') {
        return dim
    }
    const targetDim =
        (context.timeField && timeFieldTimeDimensionMap[context.timeField]) ||
        (context.outputType && outputTypeTimeDimensionMap[context.outputType])
    if (!targetDim) {
        return dim
    }
    vis.legacy = true
    return { ...dim, dimension: targetDim, dimensionType: 'PERIOD' }
}

const renameLegacyDimensionId = (
    dim: DimensionRecord,
    vis: SavedVisualization
): DimensionRecord => {
    const renamed = LEGACY_DIMENSION_ID_RENAMES[dim.dimension]
    if (!renamed) {
        return dim
    }
    vis.legacy = true
    return { ...dim, dimension: renamed }
}

// Meta dims, contextless dim types, program indicators and tracked entity
// attributes don't carry program/stage context.
const dimensionTakesNoProgramContext = (dim: DimensionRecord): boolean =>
    META_DIMENSION_IDS.has(dim.dimension) ||
    (typeof dim.dimensionType === 'string' &&
        NO_CONTEXT_DIMENSION_TYPES.has(dim.dimensionType))

// Propagate the old event-visualizer top-level program/programStage onto a
// dimension that doesn't carry them. Enrollment-scoped IDs are tied to the
// program, not a stage, so they get program only. This doesn't flip `legacy`:
// the top-level program/programStage presence already seeded it.
const applyProgramStageContext = (
    dim: DimensionRecord,
    { programRef, stageRef }: LegacyDimensionContext
): DimensionRecord => {
    let out = dim
    if (programRef && !out.program) {
        out = { ...out, program: programRef }
    }
    const skipStageRef = ENROLLMENT_SCOPED_DIMENSION_IDS.has(out.dimension)
    if (!skipStageRef && stageRef && !out.programStage) {
        out = { ...out, programStage: stageRef }
    }
    return out
}

// A legacy vis stored the enrollment org unit as bare `ou`; this app uses
// `enrollmentOu` where the wire form needs it (EVENT/TEI LINE_LIST). Upgrade
// with the same rule the save path uses — a no-op for ENROLLMENT/PIVOT (where
// `ou` is canonical) and for the stage event OU (which has a programStage).
const upgradeLegacyEnrollmentOu = (
    dim: DimensionRecord,
    context: LegacyDimensionContext,
    vis: SavedVisualization
): DimensionRecord => {
    if (
        !context.outputType ||
        dim.dimension !== 'ou' ||
        !dim.program?.id ||
        dim.programStage
    ) {
        return dim
    }
    const canonicalOu = toEventVisualizationDimensionId({
        dimensionId: 'enrollmentOu',
        programId: dim.program.id,
        outputType: context.outputType,
        visualizationType: context.visualizationType,
    })
    if (canonicalOu === dim.dimension) {
        return dim
    }
    vis.legacy = true
    return { ...dim, dimension: canonicalOu }
}

/* Normalise one dimension, in order: materialise a legacy `pe`, rename old IDs,
 * then — unless the dim takes no program/stage context — propagate top-level
 * program/programStage and upgrade a legacy enrollment `ou`. The rename runs
 * before the context check so a meta dim renamed from a legacy ID (e.g.
 * `createdDate` → `created`) is recognised as context-free. Steps flip
 * `vis.legacy` as they upgrade the shape. */
const normalizeLegacyDimension = (
    dim: DimensionRecord,
    context: LegacyDimensionContext,
    vis: SavedVisualization
): DimensionRecord => {
    const renamed = renameLegacyDimensionId(
        materializeLegacyPeDimension(dim, context, vis),
        vis
    )
    if (dimensionTakesNoProgramContext(renamed)) {
        return renamed
    }
    return upgradeLegacyEnrollmentOu(
        applyProgramStageContext(renamed, context),
        context,
        vis
    )
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
 * - Drop the legacy `dy`/`latitude`/`longitude` dimensions
 * - Mark output as `legacy: true` whenever any of the above upgraded the
 *   persisted shape, so the vis cannot be overwritten in place — only "Save
 *   as" is allowed. Overwriting would silently persist in the canonical
 *   format, breaking older apps that still read the legacy shape.
 * - Drop a dimension's `legendSet` when it cannot apply, ie. the dimension is not
 *   numeric, or it carries a filter that is not a legend `IN:` filter. Grouping
 *   makes analytics return legend IDs, so a raw-value filter beside it matches
 *   nothing; the filter wins because it is always an explicit user choice, while
 *   a legend set may be a seeded default. Unlike the conversions above this does
 *   not imply `legacy` — the combination was never a valid persisted shape, so
 *   there is nothing to upgrade and the vis can still be saved in place.
 *
 * Out of scope (handled downstream — these run on every load, not just legacy
 * visualizations, so they do not imply the `legacy` flag):
 * - `completedOnly` → `eventStatus=COMPLETED` filter (not legacy-only)
 * - `PROGRAM_DATA_ELEMENT` → `DATA_ELEMENT` (wire → app shape)
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
        sortOrder,
        topLimit,
        ...rest
    } = apiVis
    const normalizedVis = rest as SavedVisualization
    const context: LegacyDimensionContext = {
        outputType: rest.outputType as OutputType | undefined,
        visualizationType: rest.type as VisualizationType,
        timeField,
        programRef: program ? { id: program.id } : undefined,
        stageRef: programStage ? { id: programStage.id } : undefined,
    }

    // Legacy when a top-level signal is present, or a step below upgrades the
    // shape. A legacy vis can't be saved in place — that would rewrite it in
    // the canonical format and break older apps that read the original.
    if (legacy || program || programStage || orgUnitField || programStatus) {
        normalizedVis.legacy = true
    }

    const rawFilters = [
        ...filters,
        ...(orgUnitField
            ? [{ dimension: 'ou', items: [{ id: orgUnitField }] }]
            : []),
        ...(programStatus
            ? [{ dimension: 'programStatus', items: [{ id: programStatus }] }]
            : []),
    ]

    /* Dropping a dimension rewrites the persisted shape, so it flips `legacy`
     * the same way the conversions above do. */
    const dropLegacyDimensions = (dims: DimensionRecord[]) => {
        const kept = dims.filter(
            (dim) => !DROPPED_LEGACY_DIMENSIONS.has(dim.dimension)
        )
        if (kept.length !== dims.length) {
            normalizedVis.legacy = true
        }
        return kept
    }

    normalizedVis.columns = dropInvalidGrouping(
        dropLegacyDimensions(columns).map((dim) =>
            normalizeLegacyDimension(dim, context, normalizedVis)
        )
    )
    normalizedVis.rows = dropInvalidGrouping(
        dropLegacyDimensions(rows).map((dim) =>
            normalizeLegacyDimension(dim, context, normalizedVis)
        )
    )
    normalizedVis.filters = dropInvalidGrouping(
        dropLegacyDimensions(rawFilters).map((dim) =>
            normalizeLegacyDimension(dim, context, normalizedVis)
        )
    )

    if (
        program &&
        !normalizedVis.programDimensions?.some((p) => p.id === program.id)
    ) {
        normalizedVis.programDimensions = [
            ...(normalizedVis.programDimensions ?? []),
            program,
        ]
    }

    // `timeField` holding a known backend enum value has been materialised
    // into a concrete time dimension above; keep it only when it holds a
    // data-element / attribute UID (non-legacy usage that the analytics
    // request still needs). Dropping a known-enum `timeField` is an upgrade.
    const preserveTimeField =
        typeof timeField === 'string' && !KNOWN_TIME_FIELD_VALUES.has(timeField)
    if (preserveTimeField) {
        normalizedVis.timeField = timeField
    } else if (typeof timeField === 'string') {
        normalizedVis.legacy = true
    }

    if (sortOrder !== 0) {
        normalizedVis.sortOrder = sortOrder
    }
    if (topLimit !== 0) {
        normalizedVis.topLimit = topLimit
    }

    return normalizedVis
}
