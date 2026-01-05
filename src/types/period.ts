import type { PERIOD_TYPES, RELATIVE_PERIODS } from '@constants/periods'

export type RelativePeriod = (typeof RELATIVE_PERIODS)[number]

export type PeriodType = (typeof PERIOD_TYPES)[number]
