import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { EventVisualizationType } from '@types'

export const VIS_TYPE_LINE_LIST = 'LINE_LIST'
export const VIS_TYPE_PIVOT_TABLE = 'PIVOT_TABLE'

export const SUPPORTED_VIS_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        VIS_TYPE_LINE_LIST,
        VIS_TYPE_PIVOT_TABLE,
    ] as const)

export type SupportedVisType = (typeof SUPPORTED_VIS_TYPES)[number]
