import type { Axis } from './axis'

/**
 * Represents conditions (filters) applied to a dimension.
 */
export type ConditionsObject = {
    /** Filter condition string (e.g., "GT:5:LT:10") or array of conditions */
    condition?: string | string[]
    /** Legend set ID for legend-based filtering */
    legendSet?: string
}

/**
 * Represents repetition configuration for repeated events.
 */
export type RepetitionsObject = {
    /** Number of most recent events to include */
    mostRecent: number
    /** Number of oldest events to include */
    oldest: number
}

/**
 * Represents a dimension in the layout with explicit context.
 *
 * All IDs are singular (no nesting):
 * - dimensionId: just "dataElementId" (no "programId.stageId.dimensionId")
 * - programId: just "programId"
 * - programStageId: just "stageId"
 * - trackedEntityTypeId: just "trackedEntityTypeId"
 *
 * Context fields indicate which program/stage/type this dimension belongs to.
 * Items, conditions, and repetitions are co-located with the dimension for clarity.
 */
export type LayoutDimension = {
    /** Singular dimension ID (e.g., "dataElementId", "ou", "eventDate") */
    dimensionId: string

    /** Program context - which program this dimension belongs to */
    programId?: string

    /** Program stage context - which stage this dimension belongs to */
    programStageId?: string

    /** Tracked entity type context - for TRACKED_ENTITY_INSTANCE output type */
    trackedEntityTypeId?: string

    /** Repetition index for repeated events (e.g., 0, 1, -1 for most recent) */
    repetitionIndex?: number

    /** Selected item IDs for this dimension (e.g., org unit IDs, period IDs) */
    items: string[]

    /** Filter conditions applied to this dimension */
    conditions?: ConditionsObject

    /** Repetition configuration for repeated events */
    repetitions?: RepetitionsObject
}

/**
 * Layout grouped by axis - dimensions organized into columns, rows, and filters.
 */
export type Layout = Record<Axis, LayoutDimension[]>

/**
 * Identifier for locating a specific dimension.
 * Used in action payloads and function parameters to specify which dimension to operate on.
 *
 * A dimension is uniquely identified by its dimensionId plus context fields.
 * For example, the same data element can appear twice with different program stages.
 */
export type DimensionIdentifier = {
    /** Singular dimension ID */
    dimensionId: string

    /** Program context (optional, used for disambiguation) */
    programId?: string

    /** Program stage context (optional, used for disambiguation) */
    programStageId?: string

    /** Tracked entity type context (optional) */
    trackedEntityTypeId?: string

    /** Repetition index (optional, for repeated events) */
    repetitionIndex?: number
}

/**
 * Partial update to a dimension's data (items, conditions, repetitions).
 * Used when updating dimension configuration without changing its identity
 */
export type LayoutDimensionUpdate = Partial<
    Omit<
        LayoutDimension,
        | 'dimensionId'
        | 'programId'
        | 'programStageId'
        | 'trackedEntityTypeId'
        | 'repetitionIndex'
    >
>
