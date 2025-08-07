import type { EventVisualizationType, RelativePeriodEnum } from '@types'
import { asStringLiteralSubsetArray } from './helpers'

export const SUPPORTED_VIS_TYPES =
    asStringLiteralSubsetArray<EventVisualizationType>()([
        'LINE_LIST',
        'PIVOT_TABLE',
    ] as const)
export type SupportedVisType = (typeof SUPPORTED_VIS_TYPES)[number]

export const SUPPORTED_RELATIVE_PERIODS =
    asStringLiteralSubsetArray<RelativePeriodEnum>()([
        'TODAY',
        'YESTERDAY',
        'LAST_3_DAYS',
        'LAST_7_DAYS',
        'LAST_14_DAYS',
        'THIS_WEEK',
        'LAST_WEEK',
        'LAST_4_WEEKS',
        'LAST_12_WEEKS',
        'LAST_52_WEEKS',
        'WEEKS_THIS_YEAR',
        'THIS_MONTH',
        'LAST_MONTH',
        'LAST_3_MONTHS',
        'LAST_6_MONTHS',
        'LAST_12_MONTHS',
        'MONTHS_THIS_YEAR',
        'THIS_BIMONTH',
        'LAST_BIMONTH',
        'LAST_6_BIMONTHS',
        'BIMONTHS_THIS_YEAR',
        'THIS_QUARTER',
        'LAST_QUARTER',
        'LAST_4_QUARTERS',
        'QUARTERS_THIS_YEAR',
        'THIS_SIX_MONTH',
        'LAST_SIX_MONTH',
        'LAST_2_SIXMONTHS',
        'THIS_FINANCIAL_YEAR',
        'LAST_FINANCIAL_YEAR',
        'LAST_5_FINANCIAL_YEARS',
        'THIS_YEAR',
        'LAST_YEAR',
    ] as const)
export type SupportedRelativePeriod =
    (typeof SUPPORTED_RELATIVE_PERIODS)[number]

export const USER_ORG_UNITS = [
    'USER_ORGUNIT',
    'USER_ORGUNIT_CHILDREN',
    'USER_ORGUNIT_GRANDCHILDREN',
] as const
export type UserOrgUnit = (typeof USER_ORG_UNITS)[number]
