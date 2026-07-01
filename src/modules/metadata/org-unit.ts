import i18n from '@dhis2/d2-i18n'
import type { DimensionId, DimensionMetadataItem, OutputType } from '@types'

export const getDefaultOrgUnitMetadata = (
    outputType?: OutputType
): Partial<Record<DimensionId, DimensionMetadataItem>> => ({
    ou: {
        id: 'ou',
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(outputType),
        valueType: 'ORGANISATION_UNIT',
    },
})

export const getDefaultOrgUnitLabel = (outputType?: OutputType): string =>
    outputType === 'TRACKED_ENTITY_INSTANCE'
        ? i18n.t('Registration org. unit')
        : i18n.t('Organisation unit')
