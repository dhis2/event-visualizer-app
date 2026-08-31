import type { EventVisualizationType } from '@types'
import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'

export const AGGREGATED_VISUALIZATION_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        'PIVOT_TABLE',
    ] as const)

export const INDIVIDUAL_VISUALIZATION_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()(['LINE_LIST'] as const)

export const VISUALIZATION_TYPES = [
    ...INDIVIDUAL_VISUALIZATION_TYPES,
    ...AGGREGATED_VISUALIZATION_TYPES,
]

/* Typed as a set of plain strings so membership of an arbitrary string can be
 * tested — the array's element type only accepts a value already known to be a
 * visualization type. */
export const VISUALIZATION_TYPE_SET: ReadonlySet<string> = new Set(
    VISUALIZATION_TYPES
)
