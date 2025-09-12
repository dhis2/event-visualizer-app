import i18n from '@dhis2/d2-i18n'

export const getBooleanValues = (): Record<string, string> => ({
    1: i18n.t('Yes'),
    0: i18n.t('No'),
    NV: i18n.t('Not answered'),
})
