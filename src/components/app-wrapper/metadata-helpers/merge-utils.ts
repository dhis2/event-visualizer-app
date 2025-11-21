import deepEqual from 'deep-equal'
import { isMetadataItem } from './type-guards'
import type { MetadataItem, NormalizedMetadataInputItem } from './types'

// Helper to check if a value is considered "empty" for merge logic
function isEmpty(value: unknown): boolean {
    return (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0)
    )
}

function isComplexFieldValue(value: unknown): boolean {
    return typeof value === 'object' && value !== null
}

export function smartMergeWithChangeDetection(
    existing: MetadataItem | undefined,
    newItem: NormalizedMetadataInputItem
): { hasChanges: boolean; mergedItem: MetadataItem } {
    // If no existing item, just return the new item
    if (!existing) {
        if (isMetadataItem(newItem)) {
            return { hasChanges: true, mergedItem: newItem }
        } else {
            throw new Error('New item is not a valid metadata item')
        }
    }

    let hasChanges = false
    const mergedItem: MetadataItem = { ...existing }

    // Check each property in the new item
    for (const [key, newValue] of Object.entries(newItem)) {
        const existingValue = (existing as Record<string, unknown>)[key]

        let finalValue: unknown

        // Handle all 4 combinations of empty/populated values explicitly
        if (isEmpty(existingValue) && isEmpty(newValue)) {
            // Both empty - keep existing to avoid unnecessary change detection
            finalValue = existingValue
        } else if (isEmpty(existingValue) && !isEmpty(newValue)) {
            // Existing empty, new populated - use new value
            finalValue = newValue
        } else if (!isEmpty(existingValue) && isEmpty(newValue)) {
            // Existing populated, new empty - keep existing
            finalValue = existingValue
        } else {
            // Both values are populated use new if value is not equal
            if (
                isComplexFieldValue(existingValue) ||
                isComplexFieldValue(newValue)
            ) {
                const isEqual = deepEqual(existingValue, newValue)
                // Complex field (array or object) - use deep equality checking
                finalValue = isEqual ? existingValue : newValue
            } else {
                // Primitive field, simply overwrite, this won't count as a change if the value is the same
                finalValue = newValue
            }
        }

        // Check if this property actually changed
        if (finalValue !== existingValue) {
            hasChanges = true
            mergedItem[key] = finalValue
        }
    }

    return { hasChanges, mergedItem }
}
