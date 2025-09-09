import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { EventVisualizationType } from '@types'

export const SUPPORTED_VIS_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        'LINE_LIST',
        'PIVOT_TABLE',
    ] as const)

// Convert EventVisualizationType to SupportedVisType
// Default to 'LINE_LIST' if the type is not supported
export const convertToSupportedVisType = (
    visType: EventVisualizationType
): SupportedVisType => {
    switch (visType) {
        case 'LINE_LIST':
        case 'PIVOT_TABLE':
            return visType
        default:
            return 'LINE_LIST'
    }
}

export type SupportedVisType = (typeof SUPPORTED_VIS_TYPES)[number]
