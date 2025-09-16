import i18n from '@dhis2/d2-i18n'
import type { SupportedInputType } from '@constants/input-types'
import type { DimensionId, InternalDimensionRecord } from '@types'

export const getDefaultOrgUnitMetadata = (
    inputType?: SupportedInputType
): Partial<Record<DimensionId, InternalDimensionRecord>> => ({
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(inputType),
    },
})

export const getDefaultOrgUnitLabel = (
    inputType?: SupportedInputType
): string => {
    if (inputType === 'TRACKED_ENTITY_INSTANCE') {
        return i18n.t('Registration org. unit')
    } else {
        return i18n.t('Organisation unit')
    }
}
