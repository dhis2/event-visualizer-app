import i18n from '@dhis2/d2-i18n'
import type { DimensionId, InputType, InternalDimensionRecord } from '@types'

export const getDefaultOrgUnitMetadata = (
    inputType?: InputType
): Partial<Record<DimensionId, InternalDimensionRecord>> => ({
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(inputType),
    },
})

export const getDefaultOrgUnitLabel = (inputType?: InputType): string => {
    if (inputType === 'TRACKED_ENTITY_INSTANCE') {
        return i18n.t('Registration org. unit')
    } else {
        return i18n.t('Organisation unit')
    }
}
