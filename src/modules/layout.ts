import i18n from '@dhis2/d2-i18n'
import type { SupportedAxis } from '@constants/axis-types'

export const getAxisNames = (): Record<SupportedAxis, string> => ({
    columns: i18n.t('Columns'),
    filters: i18n.t('Filter'),
    rows: i18n.t('Rows'),
})
