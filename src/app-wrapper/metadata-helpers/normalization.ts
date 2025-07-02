import type { MetadataItem as OpenApiMetadataItem } from '@types'
import {
    isMetadataItem,
    isSimpleMetadataItem,
    isProgramMetadataItem,
    isOptionSetMetadataItem,
} from './type-guards'
import type {
    AnyMetadataItemInput,
    MetadataItem,
    SimpleMetadataItem,
    ProgramMetadataItem,
    OptionSetMetadataItem,
    MetadataStoreItem,
} from './types'

// Normalization helper functions for each input type
export function normalizeMetadataItem(
    input: MetadataItem
): Omit<MetadataItem, 'uid'> & { id: string } {
    const result: Partial<Omit<MetadataItem, 'uid'> & { id: string }> = {
        id: input.uid || '', // Convert uid to id
        aggregationType: input.aggregationType,
        dimensionItemType: input.dimensionItemType,
        dimensionType: input.dimensionType,
        totalAggregationType: input.totalAggregationType,
        valueType: input.valueType,
    }

    // Copy over optional primitive properties that exist in the input
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

    // Copy over optional complex properties, defaulting to empty if not present
    if (input.indicatorType !== undefined) {
        result.indicatorType = input.indicatorType
    }
    if (input.style !== undefined) {
        result.style = input.style
    }
    result.options = input.options || []

    return result as Omit<MetadataItem, 'uid'> & { id: string }
}

export function normalizeSimpleMetadataItem(
    input: SimpleMetadataItem
): OpenApiMetadataItem {
    // Get the single key-value pair from the simple metadata item
    const [key, value] = Object.entries(input)[0]

    // Create minimal OpenApiMetadataItem using the key as id and value as name
    return {
        id: key,
        name: value,
    } as unknown as OpenApiMetadataItem
}

export function normalizeProgramMetadataItem(
    input: ProgramMetadataItem
): ProgramMetadataItem {
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

export function normalizeOptionSetMetadataItem(
    input: OptionSetMetadataItem
): OpenApiMetadataItem {
    // Create OpenApiMetadataItem from OptionSet using type assertion for complex mapping
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

    return result as unknown as OpenApiMetadataItem
}

export function normalizeMetadataInputItem(
    input: AnyMetadataItemInput
): MetadataStoreItem {
    if (isMetadataItem(input)) {
        return normalizeMetadataItem(input)
    } else if (isProgramMetadataItem(input)) {
        return normalizeProgramMetadataItem(input)
    } else if (isOptionSetMetadataItem(input)) {
        return normalizeOptionSetMetadataItem(input)
    } else if (isSimpleMetadataItem(input)) {
        return normalizeSimpleMetadataItem(input)
    } else {
        throw new Error('Unknown metadata input type')
    }
}
