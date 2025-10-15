import {
    isMetadataItem,
    isSimpleMetadataItem,
    isProgramMetadataItem,
    isOptionSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isLegendSetMetadataItem,
} from './type-guards'
import type {
    AnyMetadataItemInput,
    SimpleMetadataItem,
    ProgramMetadataItem,
    OptionSetMetadataItem,
    MetadataStoreItem,
    NormalizedMetadataItem,
    OrganisationUnitMetadataItem,
    LegendSetMetadataItem,
} from './types'
import type { MetadataItem } from '@types'

// Normalization helper functions for each input type
export const normalizeMetadataItem = (
    input: MetadataItem
): NormalizedMetadataItem => {
    const result: NormalizedMetadataItem = {
        id: input.uid, // Convert uid to id
        name: input.name,
    }

    // Copy over optional primitive properties that exist in the input
    if (input.aggregationType !== undefined) {
        result.aggregationType = input.aggregationType
    }
    if (input.dimensionItemType !== undefined) {
        result.dimensionItemType = input.dimensionItemType
    }
    if (input.dimensionType !== undefined) {
        result.dimensionType = input.dimensionType
    }
    if (input.totalAggregationType !== undefined) {
        result.totalAggregationType = input.totalAggregationType
    }
    if (input.valueType !== undefined) {
        result.valueType = input.valueType
    }
    if (input.code !== undefined) {
        result.code = input.code
    }
    if (input.description !== undefined) {
        result.description = input.description
    }
    if (input.name !== undefined) {
        result.name = input.name
    }
    if (input.endDate !== undefined) {
        result.endDate = input.endDate
    }
    if (input.startDate !== undefined) {
        result.startDate = input.startDate
    }
    if (input.expression !== undefined) {
        result.expression = input.expression
    }
    if (input.legendSet !== undefined) {
        result.legendSet = input.legendSet
    }

    // Copy over optional complex object properties that exist in the input
    if (input.indicatorType !== undefined) {
        result.indicatorType = input.indicatorType
    }

    // Handle complex properties, defaulting to empty array/object if not present
    result.options = input.options !== undefined ? input.options : []
    result.style = input.style !== undefined ? input.style : {}

    return result as Omit<MetadataItem, 'uid'> & { id: string }
}

export const normalizeSimpleMetadataItem = (
    input: SimpleMetadataItem
): NormalizedMetadataItem => {
    // Get the single key-value pair from the simple metadata item
    const [key, value] = Object.entries(input)[0]

    // Create minimal NormalizedMetadataItem using the key as id and value as name
    return {
        id: key,
        name: value,
    } as unknown as NormalizedMetadataItem
}

export const normalizeProgramMetadataItem = (
    input: ProgramMetadataItem
): ProgramMetadataItem => {
    // ProgramMetadataItem is already in the correct format for MetadataStoreItem
    const result: ProgramMetadataItem = {
        id: input.id,
        name: input.name,
        programType: input.programType,
    }

    // Copy over optional primitive properties that exist in the input
    if (input.code !== undefined) {
        result.code = input.code
    }
    if (input.displayIncidentDate !== undefined) {
        result.displayIncidentDate = input.displayIncidentDate
    }

    // Handle optional complex property, defaulting to empty array if not present
    result.programStages = input.programStages || []

    return result
}

export const normalizeOptionSetMetadataItem = (
    input: OptionSetMetadataItem
): NormalizedMetadataItem => {
    // Create NormalizedMetadataItem from OptionSet using type assertion for complex mapping
    const result = {
        id: input.id,
        name: input.name || '',
        code: input.code,
        description: input.description,
        created: input.created,
        lastUpdated: input.lastUpdated,
        valueType: input.valueType,
        // OptionSet specific properties
        attributeValues: input.attributeValues || [],
        options: input.options || [],
        sharing: input.sharing || {},
        translations: input.translations || [],
    }

    return result as unknown as NormalizedMetadataItem
}

export const normalizeLegendSetMetadataItem = (
    input: LegendSetMetadataItem
): LegendSetMetadataItem => {
    // Extract only the required properties to ensure no additional properties are present
    return {
        id: input.id,
        name: input.name,
        legends: input.legends,
    }
}

export const normalizeOrganisationUnitMetadataItem = (
    input: OrganisationUnitMetadataItem
): OrganisationUnitMetadataItem => {
    // For org units, normalization is identity
    return input
}

export const normalizeMetadataInputItem = (
    input: AnyMetadataItemInput
): MetadataStoreItem => {
    if (isMetadataItem(input)) {
        return normalizeMetadataItem(input)
    } else if (isProgramMetadataItem(input)) {
        return normalizeProgramMetadataItem(input)
    } else if (isOptionSetMetadataItem(input)) {
        return normalizeOptionSetMetadataItem(input)
    } else if (isSimpleMetadataItem(input)) {
        return normalizeSimpleMetadataItem(input)
    } else if (isLegendSetMetadataItem(input)) {
        return normalizeLegendSetMetadataItem(input)
    } else if (isOrganisationUnitMetadataItem(input)) {
        return normalizeOrganisationUnitMetadataItem(input)
    } else {
        throw new Error('Unknown metadata input type')
    }
}
