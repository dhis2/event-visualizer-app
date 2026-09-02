import {
    CONTEXTLESS_DIMENSION_TYPES,
    ENROLLMENT_SCOPED_DIMENSION_IDS,
    META_DIMENSION_IDS,
    WIRE_ONLY_DIMENSIONS,
} from '@modules/dimension/ids'
import {
    KNOWN_TIME_FIELD_VALUES,
    outputTypeTimeDimensionMap,
    timeFieldTimeDimensionMap,
} from '@modules/dimension/time'
import { toEventVisualizationDimensionId } from '@modules/dimension/translation'
import type {
    ApiSavedVisualization,
    DimensionId,
    DimensionRecord,
    OutputType,
    SavedVisualization,
    VisualizationType,
} from '@types'

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
 * - Drop the wire-only `dy`/`latitude`/`longitude` dimensions
 * - Mark output as `legacy: true` whenever any of the above upgraded the
 *   persisted shape, so the vis cannot be overwritten in place — only "Save
 *   as" is allowed. Overwriting would silently persist in the canonical
 *   format, breaking older apps that still read the legacy shape.
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

    /* Wire-only dimensions mark where a legacy Event Report put its value
     * column; the app expresses that with the custom value fields instead, and
     * carries no layout position for them. Dropping them changes the persisted
     * shape, so it flips `legacy` like every other upgrade here. */
    const dropWireOnlyDimensions = (dims: DimensionRecord[]) => {
        const kept = dims.filter(
            (dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension)
        )
        if (kept.length !== dims.length) {
            normalizedVis.legacy = true
        }
        return kept
    }

    normalizedVis.columns = dropWireOnlyDimensions(columns).map((dim) =>
        normalizeLegacyDimension(dim, context, normalizedVis)
    )
    normalizedVis.rows = dropWireOnlyDimensions(rows).map((dim) =>
        normalizeLegacyDimension(dim, context, normalizedVis)
    )
    normalizedVis.filters = dropWireOnlyDimensions(rawFilters).map((dim) =>
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
