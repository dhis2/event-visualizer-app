import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SUPPORTED_VIS_TYPES } from '../constants'
import type { SupportedVisType } from '../constants'

export const getVisTypeDescriptions = (): Record<SupportedVisType, string> => ({
    LINE_LIST: i18n.t(
        'Track or compare changes over time. Recommend period as category. (adjust for EVER)'
    ),
    PIVOT_TABLE: i18n.t(
        'View data and indicators in a manipulatable table. (adjust for EVER)'
    ),
})

export const useVisTypesFilterByVersion = (): ((
    visType: SupportedVisType
) => boolean) => {
    const { serverVersion } = useConfig()
    if (typeof serverVersion?.minor !== 'number') {
        throw new Error('serverVersion is not a number')
    }

    const filterVisTypesByVersion = (visType: SupportedVisType) =>
        // only PT and LL enabled in the first version
        serverVersion.minor < 44 && SUPPORTED_VIS_TYPES.includes(visType)
            ? true
            : false

    return filterVisTypesByVersion
}
