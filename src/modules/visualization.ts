import { VIS_TYPE_LINE_LIST, VIS_TYPE_PIVOT_TABLE } from '@dhis2/analytics'
import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'

export const visTypes = [VIS_TYPE_LINE_LIST, VIS_TYPE_PIVOT_TABLE]

export const getVisTypeDescriptions = (): Record<string, string> => ({
    [VIS_TYPE_LINE_LIST]: i18n.t(
        'Track or compare changes over time. Recommend period as category. (adjust for EVER)'
    ),
    [VIS_TYPE_PIVOT_TABLE]: i18n.t(
        'View data and indicators in a manipulatable table. (adjust for EVER)'
    ),
})

export const useVisTypesFilterByVersion = (): ((
    visType: string
) => boolean) => {
    const { serverVersion } = useConfig()

    const filterVisTypesByVersion = (visType: string) =>
        // only PT and LL enabled in the first version
        serverVersion.minor < 44 &&
        [VIS_TYPE_LINE_LIST, VIS_TYPE_PIVOT_TABLE].includes(visType)
            ? true
            : false

    return filterVisTypesByVersion
}
