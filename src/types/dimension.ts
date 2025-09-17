import type { DimensionType as OpenApiDimensionType } from './dhis2-openapi-schemas'
import type {
    DIMENSION_TYPES,
    PROGRAM_DIMENSION_TYPES,
    YOUR_DIMENSION_TYPES,
    DIMENSION_IDS,
    TIME_DIMENSION_IDS,
} from '@constants/dimensions'
import type { DimensionRecord } from '@types'

// Extend DimensionType to include DATA_ELEMENT, STATUS, and USER
export type ExtendedDimensionType =
    | OpenApiDimensionType
    | 'DATA_ELEMENT'
    | 'STATUS'
    | 'USER'

export type DimensionType = (typeof DIMENSION_TYPES)[number]

export type ProgramDimensionType = (typeof PROGRAM_DIMENSION_TYPES)[number]

export type YourDimensionType = (typeof YOUR_DIMENSION_TYPES)[number]

export type DimensionId = (typeof DIMENSION_IDS)[number]

export type TimeDimensionId = (typeof TIME_DIMENSION_IDS)[number]

// TODO: check about this one
export type InternalDimensionRecord = Omit<
    DimensionRecord,
    'dimension' | 'items'
> & {
    id: string
    name: string
}
