import type {
    ProgramMetadataItem,
    ProgramStageMetadataItem,
    OptionSetMetadataItem,
    OrganisationUnitMetadataItem,
    MetadataItem,
    LegendSetMetadataItem,
    UserOrgUnitMetadataItem,
    MetadataInputItem,
    MetadataItemWithName,
} from './types'

// Helper function to check if input is a plain object
export const isObject = (input: unknown): input is Record<string, unknown> => {
    return typeof input === 'object' && input !== null && !Array.isArray(input)
}

// Helper function to check if input is a non-empty string
export const isPopulatedString = (input: unknown): input is string => {
    return typeof input === 'string' && input.length > 0
}

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

export const isMetadataItemWithName = (
    input: unknown
): input is MetadataItemWithName => {
    return (
        isObject(input) &&
        'id' in input &&
        'name' in input &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.name)
    )
}

export const isProgramMetadataItem = (
    input: unknown
): input is ProgramMetadataItem => {
    return (
        isObject(input) &&
        'id' in input &&
        'programType' in input &&
        'name' in input &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.name) &&
        isPopulatedString(input.programType)
    )
}

export const isProgramStageMetadataItem = (
    input: unknown
): input is ProgramStageMetadataItem => {
    return (
        isObject(input) &&
        'id' in input &&
        'name' in input &&
        'repeatable' in input &&
        'hideDueDate' in input &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.name) &&
        typeof input.repeatable === 'boolean' &&
        typeof input.hideDueDate === 'boolean'
    )
}

export const isOptionSetMetadataItem = (
    input: unknown
): input is OptionSetMetadataItem => {
    return (
        isObject(input) &&
        'options' in input &&
        'id' in input &&
        isPopulatedString(input.id) &&
        Array.isArray(input.options)
    )
}

export function isLegendSetMetadataItem(
    input: unknown
): input is LegendSetMetadataItem {
    return (
        isObject(input) &&
        'id' in input &&
        'legends' in input &&
        isPopulatedString(input.id) &&
        Array.isArray(input.legends)
    )
}

export const isOrganisationUnitMetadataItem = (
    input: unknown
): input is OrganisationUnitMetadataItem => {
    return (
        isObject(input) &&
        'id' in input &&
        'path' in input &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.path)
    )
}

export const isUserOrgUnitMetadataItem = (
    input: unknown
): input is UserOrgUnitMetadataItem => {
    return (
        isObject(input) &&
        'organisationUnits' in input &&
        'id' in input &&
        'name' in input &&
        Array.isArray(input.organisationUnits) &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.name)
    )
}

export const isMetadataItem = (input: unknown): input is MetadataItem => {
    return (
        isMetadataItemWithName(input) ||
        isLegendSetMetadataItem(input) ||
        isOptionSetMetadataItem(input)
    )
}
