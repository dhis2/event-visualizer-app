import i18n from '@dhis2/d2-i18n'

export const getBooleanValues = (): Record<'0' | '1' | 'NV', string> => ({
    '1': i18n.t('Yes'),
    '0': i18n.t('No'),
    NV: i18n.t('Not answered'),
})

export const parseCondition = (conditionItem: string) =>
    conditionItem.split(':').pop()?.split(';')
