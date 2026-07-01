import { getFixedMetaDimensions } from '@modules/dimension/fixed'
import { isPopulatedString } from '@modules/utils/guards'
import type { DimensionRecord, OutputType } from '@types'

// Pattern to match repetition index like [0], [1], [-1] etc.
export const REPETITION_INDEX_PATTERN = /\[(-?\d+)\]/

export const isCompoundDimensionId = (input: unknown): input is string =>
    isPopulatedString(input) && input.includes('.')

export const parseCompoundDimensionId = (
    compoundId: string
): { ids: string[]; repetitionIndex?: number } => {
    if (!isPopulatedString(compoundId)) {
        throw new Error('Dimension ID input is not a populated string')
    }

    // Extract repetition index pattern `[<integer>]` from anywhere in the input string (applies to programStage)
    const repetitionMatch = REPETITION_INDEX_PATTERN.exec(compoundId)
    const processedInput = repetitionMatch
        ? compoundId.replace(REPETITION_INDEX_PATTERN, '')
        : compoundId
    const repetitionIndex = repetitionMatch
        ? Number(repetitionMatch[1])
        : undefined
    const ids = processedInput.split('.')

    if (!isPopulatedString(ids.at(-1))) {
        throw new Error(`No valid dimension ID found in "${compoundId}"`)
    }

    if (ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected at most 3 IDs, got ${ids.length}`
        )
    }

    if (ids.some((id) => !isPopulatedString(id))) {
        throw new Error(
            `Invalid dimension ID format: empty ID found in "${compoundId}"`
        )
    }

    return { ids, repetitionIndex }
}

/**
 * Resolves a compound dimension ID to its canonical form:
 * - 3-segment (programId.stageId.dimId) → stageId.dimId
 * - 2-segment or plain ID → unchanged
 */
export const resolveId = (id: string): string => {
    const first = id.indexOf('.')
    if (first === -1) {
        return id // plain ID
    }
    const second = id.indexOf('.', first + 1)
    if (second === -1) {
        return id // 2-segment → already canonical
    }
    return id.slice(first + 1) // 3-segment → drop first part
}

export const extractPlainDimensionId = (compoundId?: string | null): string =>
    (compoundId ?? '').split('.').pop()!

/* Dimensions that exist only in the wire format (legacy event chart shape)
 * and have no meaning in the app-local layer. */
export const WIRE_ONLY_DIMENSIONS: ReadonlySet<string> = new Set([
    'dy',
    'latitude',
    'longitude',
])

/* Dimensions that are not bound to any program or stage. The backend
 * may still populate program/programStage on these in legacy visualizations;
 * drop those fields at the API → app-local boundary so that downstream code
 * (compound ID, save round-trip) treats them as the contextless dimensions
 * they actually are. */
export const META_DIMENSION_IDS = new Set(
    getFixedMetaDimensions().map((dimension) => dimension.id)
)

/* Dimension types that are not bound to any program or stage. The backend
 * may still populate program/programStage on these in legacy visualizations;
 * drop those fields at the API → app-local boundary so that downstream code
 * (compound ID, save round-trip) treats them as the contextless dimensions
 * they actually are. */
export const CONTEXTLESS_DIMENSION_TYPES: ReadonlySet<string> = new Set([
    'ORGANISATION_UNIT_GROUP_SET',
])

/* Dimension IDs that are always enrollment-scoped (prefixed with programId,
 * never stageId). Legacy visualizations propagate programStage onto all
 * dimensions, but these IDs are inherently tied to the program, not a stage. */
export const ENROLLMENT_SCOPED_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'enrollmentOu',
    'enrollmentDate',
    'incidentDate',
    'programStatus',
])

/* Dimension IDs that belong at TEI registration scope — prefixed with
 * trackedEntityTypeId when there is no program or stage context.
 * Must match what getTrackedEntityTypeFixedDimensions produces. */
const TEI_REGISTRATION_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'enrollmentOu',
])

/**
 * Constructs the canonical compound dimension ID from a DimensionRecord.
 *
 * We do NOT use `formatDimension` / `dimensionGetId` from `@dhis2/analytics`
 * because those helpers assume the old visualization shape where `programId`
 * was only included for TRACKED_ENTITY_INSTANCE. In the canonical app-local
 * format, enrollment-scoped dimensions (program but no programStage) always
 * carry a programId prefix, regardless of outputType.
 *
 * Program indicators always use plain IDs — they're owned by a single program
 * so their UIDs are unique. Tracked entity attributes use a `tetId.attrId`
 * compound prefix because the same attribute can be referenced by multiple
 * TETs (per DHIS2's metadata model); the prefix disambiguates per TET.
 */
export const getCompoundDimensionId = (
    dim: DimensionRecord,
    outputType?: OutputType,
    trackedEntityTypeId?: string
): string => {
    if (dim.dimensionType === 'PROGRAM_INDICATOR') {
        return dim.dimension
    }
    if (dim.dimensionType === 'PROGRAM_ATTRIBUTE') {
        return trackedEntityTypeId
            ? `${trackedEntityTypeId}.${dim.dimension}`
            : dim.dimension
    }
    if (ENROLLMENT_SCOPED_DIMENSION_IDS.has(dim.dimension) && dim.program?.id) {
        return `${dim.program.id}.${dim.dimension}`
    }
    if (dim.programStage?.id) {
        if (outputType === 'TRACKED_ENTITY_INSTANCE' && dim.program?.id) {
            return `${dim.program.id}.${dim.programStage.id}.${dim.dimension}`
        }
        return `${dim.programStage.id}.${dim.dimension}`
    }
    if (dim.program?.id) {
        return `${dim.program.id}.${dim.dimension}`
    }
    // TEI registration-scoped: no program or stage, prefix with trackedEntityTypeId
    if (
        trackedEntityTypeId &&
        TEI_REGISTRATION_DIMENSION_IDS.has(dim.dimension)
    ) {
        return `${trackedEntityTypeId}.${dim.dimension}`
    }
    return dim.dimension
}
