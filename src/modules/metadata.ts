import i18n from '@dhis2/d2-i18n'
import type { DimensionId, OutputType, InternalDimensionRecord } from '@types'

export const getDefaultOrgUnitMetadata = (
    outputType?: OutputType
): Partial<Record<DimensionId, InternalDimensionRecord>> => ({
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(outputType),
    },
})

export const getDefaultOrgUnitLabel = (outputType?: OutputType): string => {
    if (outputType === 'TRACKED_ENTITY_INSTANCE') {
        return i18n.t('Registration org. unit')
    } else {
        return i18n.t('Organisation unit')
    }
}
