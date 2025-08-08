import i18n from '@dhis2/d2-i18n'
import type { SupportedVisType } from '../constants'

export const getVisTypeDescriptions = (): Record<SupportedVisType, string> => ({
    LINE_LIST: i18n.t(
        'Track or compare changes over time. Recommend period as category. (adjust for EVER)'
    ),
    PIVOT_TABLE: i18n.t(
        'View data and indicators in a manipulatable table. (adjust for EVER)'
    ),
})
