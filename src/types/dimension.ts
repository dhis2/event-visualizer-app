import type { DimensionType as GeneratedDimensionType } from './dhis2-openapi-schemas'
import type {
    PROGRAM_DIMENSION_TYPES,
    YOUR_DIMENSION_TYPES,
    DIMENSION_IDS,
    TIME_DIMENSION_IDS,
} from '@constants/dimensions'

export type DimensionType =
    | Exclude<GeneratedDimensionType, 'PROGRAM_DATA_ELEMENT'>
    | 'DATA_ELEMENT'
    | 'STATUS'
    | 'USER'

export type ProgramDimensionType = (typeof PROGRAM_DIMENSION_TYPES)[number]

export type YourDimensionType = (typeof YOUR_DIMENSION_TYPES)[number]

export type DimensionId = (typeof DIMENSION_IDS)[number]

export type TimeDimensionId = (typeof TIME_DIMENSION_IDS)[number]
