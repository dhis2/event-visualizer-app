import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { DimensionId, DimensionType } from '@types'

export const PROGRAM_DIMENSION_TYPES =
    asStringLiteralSubsetArray<DimensionType>()([
        'DATA_ELEMENT',
        'CATEGORY',
        'CATEGORY_OPTION_GROUP_SET',
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
    ] as const)

export const YOUR_DIMENSION_TYPES = asStringLiteralSubsetArray<DimensionType>()(
    ['ORGANISATION_UNIT_GROUP_SET'] as const
)

export const DIMENSION_IDS = [
    'completedDate',
    'created',
    'createdBy',
    'createdDate',
    'enrollmentDate',
    'eventDate',
    'eventStatus',
    'incidentDate',
    'lastUpdated',
    'lastUpdatedBy',
    'lastUpdatedOn',
    'ou',
    'programStatus',
    'scheduledDate',
] as const

export const DIMENSION_ID_ORGUNIT: DimensionId = 'ou'

export const TIME_DIMENSION_IDS = [
    'completedDate',
    'createdDate',
    'enrollmentDate',
    'eventDate',
    'incidentDate',
    'lastUpdated',
    'lastUpdatedOn',
    'scheduledDate',
] as const
