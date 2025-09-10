import {
    PROGRAM_DIMENSION_TYPES,
    TIME_DIMENSION_IDS,
    YOUR_DIMENSION_TYPES,
} from '@constants/dimension-types'
import type {
    DimensionId,
    ExtendedDimensionType,
    ProgramDimensionType,
    TimeDimensionId,
    YourDimensionType,
} from '@types'

export const isProgramDimensionType = (
    dimensionType: ExtendedDimensionType
): dimensionType is ProgramDimensionType =>
    (PROGRAM_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

export const isYourDimensionType = (
    dimensionType: ExtendedDimensionType
): dimensionType is YourDimensionType =>
    (YOUR_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

export const isTimeDimensionId = (
    dimensionId: DimensionId
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)
