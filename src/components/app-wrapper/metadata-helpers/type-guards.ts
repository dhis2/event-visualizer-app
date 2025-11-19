import type {
    AnyMetadataItemInput,
    SimpleMetadataItem,
    ProgramMetadataItem,
    ProgramStageMetadataItem,
    OptionSetMetadataItem,
    OrganisationUnitMetadataItem,
    MetadataStoreItem,
    LegendSetMetadataItem,
    UserOrgUnitMetadataItem,
    UserOrgUnitMetadataInputItem,
} from './types'
import type { MetadataItem } from '@types'

// Helper function to check if input is a plain object
export const isObject = (input: unknown): input is Record<string, unknown> => {
    return typeof input === 'object' && input !== null && !Array.isArray(input)
}

// Helper function to check if input is a non-empty string
export const isPopulatedString = (input: unknown): input is string => {
    return typeof input === 'string' && input.length > 0
}

export const isSingleMetadataItemInput = (
    input: unknown
): input is AnyMetadataItemInput => {
    if (!isObject(input)) {
        return false
    }

    // Cast to AnyMetadataItemInput since we know it's an object
    const item = input as AnyMetadataItemInput

    return (
        isMetadataItem(item) ||
        isSimpleMetadataItem(item) ||
        isProgramMetadataItem(item) ||
        isProgramStageMetadataItem(item) ||
        isOptionSetMetadataItem(item) ||
        isLegendSetMetadataItem(item) ||
        isOrganisationUnitMetadataItem(item) ||
        isUserOrgUnitMetadataInputItem(item)
    )
}

// Type guards to narrow down AnyMetadataItemInput to specific types
export const isMetadataItem = (
    input: AnyMetadataItemInput
): input is MetadataItem => {
    return (
        'uid' in input &&
        'name' in input &&
        isPopulatedString(input.uid) &&
        isPopulatedString(input.name)
    )
}

export const isSimpleMetadataItem = (
    input: AnyMetadataItemInput
): input is SimpleMetadataItem => {
    if (!isObject(input)) {
        return false
    }

    const entries = Object.entries(input)
    return (
        entries.length === 1 &&
        isPopulatedString(entries[0][0]) &&
        isPopulatedString(entries[0][1])
    )
}

export const isProgramMetadataItem = (
    input: AnyMetadataItemInput | MetadataStoreItem
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
    input: AnyMetadataItemInput | MetadataStoreItem
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
    input: AnyMetadataItemInput | MetadataStoreItem
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
    input: AnyMetadataItemInput | MetadataStoreItem
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
    input: AnyMetadataItemInput | MetadataStoreItem
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

export const isUserOrgUnitMetadataInputItem = (
    input: unknown
): input is UserOrgUnitMetadataInputItem => {
    return (
        isObject(input) &&
        'organisationUnits' in input &&
        Array.isArray(input.organisationUnits) &&
        Object.keys(input).length === 1
    )
}
