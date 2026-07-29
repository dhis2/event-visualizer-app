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
import { getNonDefaultOptions } from '@modules/options'
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

// True when the vis has the minimum fields the API needs to accept a save.
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

// CurrentVisualization keys that aren't options. With the option keys (from
// DEFAULT_OPTIONS) they make up every CurrentVisualization key at runtime.
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
 * The CurrentVisualization-shaped subset of a SavedVisualization, for
 * comparing saved against current. A saved vis also carries fields like
 * access and createdBy that don't matter for detecting unsaved changes.
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

/* Derived from the layout, so the axes already encode them. The rebuilt
 * currentVis fills them in while a saved vis may not, so a difference here
 * isn't a real edit — ignore them when comparing. */
const DERIVED_LAYOUT_FIELDS: ReadonlySet<string> = new Set([
    'trackedEntityType',
    'attributeDimensions',
    'programDimensions',
])

const DIMENSION_AXES = new Set<string>(AXES)

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

/* Compare current against saved field by field. Options treat default and
 * absent as equal (getNonDefaultOptions); axes go through comparableAxis;
 * derived layout fields are skipped; every other field is a plain deepEqual,
 * so new fields are still compared. Iterating the union of keys keeps an
 * explicit `undefined` (which the rebuild emits, e.g. value) equal to an
 * absent key. */
const areVisualizationsEquivalent = (
    savedVis: CurrentVisualization,
    currentVis: CurrentVisualization
): boolean => {
    if (
        !deepEqual(
            getNonDefaultOptions(savedVis),
            getNonDefaultOptions(currentVis)
        )
    ) {
        return false
    }
    const saved = savedVis as Record<string, unknown>
    const current = currentVis as Record<string, unknown>
    const keys = new Set([...Object.keys(saved), ...Object.keys(current)])
    for (const key of keys) {
        if (key in DEFAULT_OPTIONS || DERIVED_LAYOUT_FIELDS.has(key)) {
            continue
        }
        if (DIMENSION_AXES.has(key)) {
            if (
                !deepEqual(
                    comparableAxis(saved[key] as DimensionArray),
                    comparableAxis(current[key] as DimensionArray)
                )
            ) {
                return false
            }
            continue
        }
        if (!deepEqual(saved[key], current[key])) {
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
    // Drop the legacy flag: a legacy vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}

export const isVisualizationEmpty = (
    visualization:
        CurrentVisualization | SavedVisualization | EmptyVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

// Checks the minimal fields shared by CurrentVisualization and
// SavedVisualization. Returning the union type lets callers narrow to either
// one (Empty is ruled out either way) without overloads.
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
    // `access` exists only on SavedVisualization, so its presence tells a full
    // saved vis apart from a persisted currentVis that just has an id.
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
        ...(vis.value?.id && {
            customValue: {
                id: vis.value.id,
                aggregationType: vis.aggregationType || 'DEFAULT',
            },
        }),
    }
}

/* Dimension types that never take a program or stage prefix. Program
 * indicators and attributes belong to a program in the model, but their
 * analytics IDs are plain. With CONTEXTLESS_DIMENSION_TYPES (e.g. org unit
 * group sets), this is the set we never tag with the legacy top-level
 * program/programStage refs. */
const NO_CONTEXT_DIMENSION_TYPES: ReadonlySet<string> = new Set([
    'PROGRAM_INDICATOR',
    'PROGRAM_ATTRIBUTE',
    ...CONTEXTLESS_DIMENSION_TYPES,
])

/* Old dimension IDs (from the legacy event-visualizer / Event Reports app)
 * mapped to the canonical IDs this app and the analytics API use. `createdDate`
 * is a real persisted alias of `created`; the other two are handled defensively
 * (the backend never persists them). */
const LEGACY_DIMENSION_ID_RENAMES: Record<string, DimensionId> = {
    createdDate: 'created',
    completedDate: 'completed',
    lastUpdatedOn: 'lastUpdated',
}

/**
 * Normalises a saved visualization from the eventVisualizations API into the
 * canonical shape this app persists, upgrading legacy shapes (old line-listing
 * `legacy: true`, old event-visualizer top-level program/programStage, old
 * dimension IDs).
 *
 * Does:
 * - propagate top-level program/programStage onto individual dimensions
 * - add the top-level program to `programDimensions`
 * - convert legacy `pe` into the concrete time dimension
 * - rename old dimension IDs (`createdDate`/`completedDate`/`lastUpdatedOn`)
 * - convert `orgUnitField` into an `ou` filter
 * - convert top-level `programStatus` into a `programStatus` filter
 * - drop `timeField` when it holds a known backend enum (e.g. `EVENT_DATE`);
 *   the time dimension above already encodes it. Keep it when it holds a
 *   data-element/attribute UID (still a live analytics parameter)
 * - drop top-level `program` and `programStage`
 * - set `legacy: true` whenever any of the above changed the shape, so the vis
 *   can't be overwritten in place (only "Save as"). Overwriting would persist
 *   the canonical format and break older apps that read the legacy shape.
 *
 * Not here (run on every load, so they don't imply `legacy`):
 * - `completedOnly` → `eventStatus=COMPLETED` filter
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

    // Legacy when anything here changes the persisted shape, since re-saving in
    // canonical format would break older apps that read the original shape — so
    // block the in-place save. Seed from the top-level signals (explicit flag,
    // old program/programStage, `orgUnitField`/`programStatus` turned into
    // filters); the per-dimension pass and `timeField` drop below also set it.
    let legacy =
        Boolean(apiVisLegacy) ||
        Boolean(program || programStage) ||
        Boolean(orgUnitField) ||
        Boolean(programStatus)

    /* One pass per dimension, in order:
     *   - convert a legacy `pe` dimension into the concrete time dimension
     *   - rename old dimension IDs to canonical form
     *   - propagate top-level program/programStage onto dimensions missing
     *     them, but only where it fits. Rename runs first so a meta dim renamed
     *     from a legacy ID (e.g. `createdDate` → `created`) is seen as
     *     context-free:
     *       · meta dims, contextless types, program indicators and attributes
     *         take no program/stage context
     *       · enrollment-scoped IDs belong to the program, not a stage, so
     *         they get program only */
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

            /* A legacy vis stored the enrollment org unit as bare `ou`; this
             * app uses `enrollmentOu` where the wire form needs it (EVENT/TEI
             * LINE_LIST). Upgrade with the same rule the save path uses — a
             * no-op for ENROLLMENT/PIVOT (where `ou` is canonical) and for the
             * stage event OU (which has a programStage). */
            if (
                outputType &&
                out.dimension === 'ou' &&
                out.program?.id &&
                !out.programStage
            ) {
                const canonicalOu = toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: out.program.id,
                    outputType,
                    visualizationType: rest.type as VisualizationType,
                })
                if (canonicalOu !== out.dimension) {
                    out = { ...out, dimension: canonicalOu }
                    legacy = true
                }
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

    // A `timeField` holding a known backend enum is already captured by the
    // time dimension built above; keep it only when it holds a
    // data-element/attribute UID (still needed by the analytics request).
    // Dropping a known-enum one is an upgrade.
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
