import type {
    SUPPORTED_DIMENSION_TYPES,
    YOUR_DIMENSION_TYPES,
    DIMENSION_IDS,
    TIME_DIMENSION_IDS,
    PROGRAM_DIMENSION_TYPES,
} from '@constants/dimension-types'
import type { DimensionType } from '@types'

// Extend DimensionType to include DATA_ELEMENT, STATUS, and USER
export type ExtendedDimensionType =
    | DimensionType
    | 'DATA_ELEMENT'
    | 'STATUS'
    | 'USER'

export type SupportedDimensionType = (typeof SUPPORTED_DIMENSION_TYPES)[number]

export type ProgramDimensionType = (typeof PROGRAM_DIMENSION_TYPES)[number]

export type YourDimensionType = (typeof YOUR_DIMENSION_TYPES)[number]

export type DimensionId = (typeof DIMENSION_IDS)[number]

export type TimeDimensionId = (typeof TIME_DIMENSION_IDS)[number]
