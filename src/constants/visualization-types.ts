import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { EventVisualizationType } from '@types'

export const SUPPORTED_VIS_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        'LINE_LIST',
        'PIVOT_TABLE',
    ] as const)

export type SupportedVisType = (typeof SUPPORTED_VIS_TYPES)[number]
