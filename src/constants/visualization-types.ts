import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { EventVisualizationType } from '@types'

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
