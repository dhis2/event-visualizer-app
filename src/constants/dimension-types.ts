import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { DimensionType } from '@types'

// Individual dimension type constants
export const DIMENSION_TYPE_ORGANISATION_UNIT = 'ORGANISATION_UNIT'
export const DIMENSION_TYPE_PERIOD = 'PERIOD'
export const DIMENSION_TYPE_DATA_ELEMENT = 'DATA_ELEMENT'
export const DIMENSION_TYPE_STATUS = 'STATUS'
export const DIMENSION_TYPE_PROGRAM_ATTRIBUTE = 'PROGRAM_ATTRIBUTE'
export const DIMENSION_TYPE_PROGRAM_INDICATOR = 'PROGRAM_INDICATOR'
export const DIMENSION_TYPE_CATEGORY_OPTION_GROUP_SET =
    'CATEGORY_OPTION_GROUP_SET'
export const DIMENSION_TYPE_ORGANISATION_UNIT_GROUP_SET =
    'ORGANISATION_UNIT_GROUP_SET'
export const DIMENSION_TYPE_CATEGORY = 'CATEGORY'
export const DIMENSION_TYPE_USER = 'USER'

// Extend DimensionType to include DATA_ELEMENT, STATUS, and USER
type ExtendedDimensionType =
    | DimensionType
    | typeof DIMENSION_TYPE_DATA_ELEMENT
    | typeof DIMENSION_TYPE_STATUS
    | typeof DIMENSION_TYPE_USER

export const SUPPORTED_DIMENSION_TYPES =
    asStringLiteralSubsetArray<ExtendedDimensionType>()([
        DIMENSION_TYPE_ORGANISATION_UNIT,
        DIMENSION_TYPE_PERIOD,
        DIMENSION_TYPE_DATA_ELEMENT,
        DIMENSION_TYPE_STATUS,
        DIMENSION_TYPE_PROGRAM_ATTRIBUTE,
        DIMENSION_TYPE_PROGRAM_INDICATOR,
        DIMENSION_TYPE_CATEGORY_OPTION_GROUP_SET,
        DIMENSION_TYPE_ORGANISATION_UNIT_GROUP_SET,
        DIMENSION_TYPE_CATEGORY,
        DIMENSION_TYPE_USER,
    ] as const)

export type SupportedDimensionType = (typeof SUPPORTED_DIMENSION_TYPES)[number]
