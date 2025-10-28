import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { DimensionId, ExtendedDimensionType } from '@types'

export const DIMENSION_TYPES =
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

export const PROGRAM_DIMENSION_TYPES =
    asStringLiteralSubsetArray<ExtendedDimensionType>()([
        'DATA_ELEMENT',
        'CATEGORY',
        'CATEGORY_OPTION_GROUP_SET',
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
    ] as const)

export const YOUR_DIMENSION_TYPES =
    asStringLiteralSubsetArray<ExtendedDimensionType>()([
        'ORGANISATION_UNIT_GROUP_SET',
    ] as const)

export const DIMENSION_IDS = [
    'created',
    'createdBy',
    'enrollmentDate',
    'eventDate',
    'eventStatus',
    'incidentDate',
    'lastUpdated',
    'lastUpdatedBy',
    'ou',
    'programStatus',
    'scheduledDate',
] as const

export const DIMENSION_ID_ORGUNIT: DimensionId = 'ou'

export const TIME_DIMENSION_IDS = [
    'enrollmentDate',
    'eventDate',
    'incidentDate',
    'lastUpdated',
    'scheduledDate',
] as const
