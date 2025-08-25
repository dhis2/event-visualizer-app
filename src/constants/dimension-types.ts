import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { DimensionType } from '@types'

// Extend DimensionType to include DATA_ELEMENT
type ExtendedDimensionType = DimensionType | 'DATA_ELEMENT' | 'STATUS' | 'USER'

export const SUPPORTED_DIMENSION_TYPES =
    asStringLiteralSubsetArray<ExtendedDimensionType>()([
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
        'PERIOD',
        'ORGANISATION_UNIT',
        'CATEGORY_OPTION_GROUP_SET',
        'ORGANISATION_UNIT_GROUP_SET',
        'CATEGORY',
        'DATA_ELEMENT',
        'STATUS',
        'USER',
    ] as const)

export type SupportedDimensionType = (typeof SUPPORTED_DIMENSION_TYPES)[number]
