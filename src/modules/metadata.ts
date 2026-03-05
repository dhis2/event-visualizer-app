import i18n from '@dhis2/d2-i18n'
import { isObject, isPopulatedString } from './validation'
import type {
    DimensionId,
    OutputType,
    Program,
    ProgramStage,
    OptionSetMetadataItem,
    OrganisationUnitMetadataItem,
    MetadataItem,
    LegendSetMetadataItem,
    UserOrgUnitMetadataItem,
    MetadataInputItem,
    DimensionMetadataItem,
} from '@types'

export const isMetadataInputItem = (
    input: unknown
): input is MetadataInputItem => {
    if (!isObject(input)) {
        return false
    }

    const hasIdKey = 'id' in input
    const hasUidKey = 'uid' in input
    const hasValidId = hasIdKey && isPopulatedString(input.id)
    const hasValidUid = hasUidKey && isPopulatedString(input.uid)

    // Must have exactly one of id or uid keys present
    if ((hasIdKey && hasUidKey) || (!hasIdKey && !hasUidKey)) {
        return false
    }

    // The present key must have a valid value
    if ((hasIdKey && !hasValidId) || (hasUidKey && !hasValidUid)) {
        return false
    }

    // Optional name fields must be strings if present
    if (
        'name' in input &&
        input.name !== undefined &&
        !isPopulatedString(input.name)
    ) {
        return false
    }
    if (
        'displayName' in input &&
        input.displayName !== undefined &&
        !isPopulatedString(input.displayName)
    ) {
        return false
    }

    return true
}

export const isProgramMetadataItem = (input: unknown): input is Program =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'programType' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    isPopulatedString(input.programType)

export const isProgramStageMetadataItem = (
    input: unknown
): input is ProgramStage =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'repeatable' in input &&
    'hideDueDate' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    typeof input.repeatable === 'boolean' &&
    typeof input.hideDueDate === 'boolean'

export const isOptionSetMetadataItem = (
    input: unknown
): input is OptionSetMetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'options' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    Array.isArray(input.options)

export const isLegendSetMetadataItem = (
    input: unknown
): input is LegendSetMetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'legends' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    Array.isArray(input.legends)

export const isOrganisationUnitMetadataItem = (
    input: unknown
): input is OrganisationUnitMetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'path' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    isPopulatedString(input.path)

export const isUserOrgUnitMetadataItem = (
    input: unknown
): input is UserOrgUnitMetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'organisationUnits' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    Array.isArray(input.organisationUnits)

export const isDimensionMetadataItem = (
    input: unknown
): input is DimensionMetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    'dimensionType' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name) &&
    isPopulatedString(input.dimensionType)

export const isMetadataItem = (input: unknown): input is MetadataItem =>
    isObject(input) &&
    'id' in input &&
    'name' in input &&
    isPopulatedString(input.id) &&
    isPopulatedString(input.name)

export const getDefaultOrgUnitMetadata = (
    outputType?: OutputType
): Partial<Record<DimensionId, DimensionMetadataItem>> => ({
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(outputType),
        valueType: 'ORGANISATION_UNIT',
    },
})

export const getDefaultOrgUnitLabel = (outputType?: OutputType): string =>
    outputType === 'TRACKED_ENTITY_INSTANCE'
        ? i18n.t('Registration org. unit')
        : i18n.t('Organisation unit')
