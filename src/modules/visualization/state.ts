import { AXES } from '@constants/axis'
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

/* Derived from the layout: any real change is already caught by comparing the
 * axes, so comparing these adds nothing. And the two array fields
 * (programDimensions, attributeDimensions) can differ in order between a loaded
 * savedVis and a rebuilt currentVis — the app rebuilds them from the layout,
 * the backend returns its own order — which a direct compare would misread as
 * an edit. */
const DERIVED_LAYOUT_FIELDS: ReadonlySet<string> = new Set([
    'trackedEntityType',
    'attributeDimensions',
    'programDimensions',
])

const DIMENSION_AXES = new Set<string>(AXES)

/* A default-valued option and an absent one mean the same thing, so both count
 * as "at default" when comparing. */
export const isDefaultOptionValue = (key: string, value: unknown): boolean =>
    value === undefined ||
    deepEqual(value, (DEFAULT_OPTIONS as Record<string, unknown>)[key])

/* An axis prepared for comparison: drop the props that aren't persisted
 * (dimensionType, valueType — the API sends PROGRAM_DATA_ELEMENT where the
 * rebuilt vis has DATA_ELEMENT) and treat an empty items array as absent, so
 * unpersisted differences don't read as edits. */
const comparableAxis = (axis: DimensionArray = []): DimensionArray =>
    removeDimensionPropertiesBeforeSaving(axis).map((dim) => {
        if (Array.isArray(dim.items) && dim.items.length === 0) {
            const withoutItems = { ...dim }
            delete withoutItems.items
            return withoutItems
        }
        return dim
    })

const areVisualizationsEquivalent = (
    savedVis: CurrentVisualization,
    currentVis: CurrentVisualization
): boolean => {
    const saved = savedVis as Record<string, unknown>
    const current = currentVis as Record<string, unknown>
    // currentVis always carries the full key set, so its keys cover every
    // field a saved vis could differ on.
    for (const key of Object.keys(current)) {
        if (key in DEFAULT_OPTIONS) {
            const bothAtDefault =
                isDefaultOptionValue(key, saved[key]) &&
                isDefaultOptionValue(key, current[key])
            if (!bothAtDefault && !deepEqual(saved[key], current[key])) {
                return false
            }
        } else if (DIMENSION_AXES.has(key)) {
            if (
                !deepEqual(
                    comparableAxis(saved[key] as DimensionArray),
                    comparableAxis(current[key] as DimensionArray)
                )
            ) {
                return false
            }
        } else if (
            !DERIVED_LAYOUT_FIELDS.has(key) &&
            !deepEqual(saved[key], current[key])
        ) {
            return false
        }
    }
    return true
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
        dims.filter((dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension))
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
        customValueByOutputType: vis.value?.id
            ? {
                  [outputType]: {
                      id: vis.value.id,
                      aggregationType: vis.aggregationType || 'DEFAULT',
                  },
              }
            : {},
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

    normalizedVis.columns = columns.map((dim) =>
        normalizeLegacyDimension(dim, context, normalizedVis)
    )
    normalizedVis.rows = rows.map((dim) =>
        normalizeLegacyDimension(dim, context, normalizedVis)
    )
    normalizedVis.filters = rawFilters.map((dim) =>
        normalizeLegacyDimension(dim, context, normalizedVis)
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
