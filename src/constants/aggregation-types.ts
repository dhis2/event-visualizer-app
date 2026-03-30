import i18n from '@dhis2/d2-i18n'
import type { AggregationType } from '@types'

export const AGGREGATION_TYPES: AggregationType[] = [
    'DEFAULT',
    'SUM',
    'AVERAGE',
    'AVERAGE_SUM_ORG_UNIT',
    'LAST',
    'LAST_AVERAGE_ORG_UNIT',
    'LAST_LAST_ORG_UNIT',
    'LAST_IN_PERIOD',
    'LAST_IN_PERIOD_AVERAGE_ORG_UNIT',
    'FIRST',
    'FIRST_AVERAGE_ORG_UNIT',
    'FIRST_FIRST_ORG_UNIT',
    'COUNT',
    'STDDEV',
    'VARIANCE',
    'MIN',
    'MAX',
    'MIN_SUM_ORG_UNIT',
    'MAX_SUM_ORG_UNIT',
    'NONE',
    'CUSTOM',
] as const

export const aggregationTypeDisplayNames: Record<AggregationType, string> = {
    DEFAULT: i18n.t('Use data element default'),
    SUM: i18n.t('Sum'),
    AVERAGE: i18n.t('Average'),
    AVERAGE_SUM_ORG_UNIT: i18n.t('Average (sum in org unit hierarchy)'),
    LAST: i18n.t('Last value (sum in org unit hierarchy)'),
    LAST_AVERAGE_ORG_UNIT: i18n.t('Last value (average in org unit hierarchy)'),
    LAST_LAST_ORG_UNIT: i18n.t(
        'Last value in period (last value in org unit hierarchy)'
    ),
    LAST_IN_PERIOD: i18n.t('Last value in period (sum in org unit hierarchy)'),
    LAST_IN_PERIOD_AVERAGE_ORG_UNIT: i18n.t(
        'Last value in period (average in org unit hierarchy)'
    ),
    FIRST: i18n.t('First value (sum in org unit hierarchy)'),
    FIRST_AVERAGE_ORG_UNIT: i18n.t(
        'First value (average in org unit hierarchy)'
    ),
    FIRST_FIRST_ORG_UNIT: i18n.t(
        'First value in period (first value in org unit hierarchy)'
    ),
    COUNT: i18n.t('Count'),
    STDDEV: i18n.t('Standard deviation'),
    VARIANCE: i18n.t('Variance'),
    MIN: i18n.t('Min'),
    MAX: i18n.t('Max'),
    MIN_SUM_ORG_UNIT: i18n.t('Min value (sum in org unit hierarchy)'),
    MAX_SUM_ORG_UNIT: i18n.t('Max value (sum in org unit hierarchy)'),
    NONE: i18n.t('None'),
    CUSTOM: i18n.t('Custom'),
}
