import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { DimensionType } from '@types'

// Extend DimensionType to include DATA_ELEMENT, STATUS, and USER
type ExtendedDimensionType = DimensionType | 'DATA_ELEMENT' | 'STATUS' | 'USER'

export const SUPPORTED_DIMENSION_TYPES =
    asStringLiteralSubsetArray<ExtendedDimensionType>()([
        'ORGANISATION_UNIT',
        'PERIOD',
        'DATA_ELEMENT',
        'STATUS',
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
        'CATEGORY_OPTION_GROUP_SET',
        'ORGANISATION_UNIT_GROUP_SET',
        'CATEGORY',
        'USER',
    ] as const)

export type SupportedDimensionType = (typeof SUPPORTED_DIMENSION_TYPES)[number]
