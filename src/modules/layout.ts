import i18n from '@dhis2/d2-i18n'
import type { Axis } from '@types'

export const getAxisName = (axisId: Axis): string => getAxisNames()[axisId]

export const getAxisNames = (): Record<Axis, string> => ({
    columns: i18n.t('Columns'),
    filters: i18n.t('Filter'),
    rows: i18n.t('Rows'),
})
