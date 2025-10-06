import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { EventVisualizationType } from '@types'

export const VISUALIZATION_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        'LINE_LIST',
        'PIVOT_TABLE',
    ] as const)
