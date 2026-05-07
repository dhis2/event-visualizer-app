import type { DimensionId, DimensionType } from '@types'
import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'

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
    'completed',
    'completedDate',
    'created',
    'createdBy',
    'createdDate',
    'enrollmentDate',
    'enrollmentOu',
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
    'completedDate', // XXX: is this a thing? or should it be completed
    'createdDate', // XXX: same for this one
    'enrollmentDate',
    'eventDate',
    'incidentDate',
    'lastUpdated',
    'lastUpdatedOn',
    'scheduledDate',
] as const
