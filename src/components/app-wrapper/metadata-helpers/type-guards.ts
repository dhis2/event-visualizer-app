import type {
    AnyMetadataItemInput,
    SimpleMetadataItem,
    ProgramMetadataItem,
    OptionSetMetadataItem,
    OrganisationUnitMetadataItem,
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
        isOptionSetMetadataItem(item) ||
        isOrganisationUnitMetadataItem(item)
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
    input: AnyMetadataItemInput
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

export const isOptionSetMetadataItem = (
    input: AnyMetadataItemInput
): input is OptionSetMetadataItem => {
    return (
        isObject(input) &&
        'options' in input &&
        'id' in input &&
        'name' in input &&
        isPopulatedString(input.id) &&
        isPopulatedString(input.name)
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
