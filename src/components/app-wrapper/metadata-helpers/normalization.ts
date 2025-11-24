import {
    isOptionSetMetadataItem,
    isLegendSetMetadataItem,
    isPopulatedString,
    isMetadataInputItem,
} from './type-guards'
import type {
    MetadataItem,
    MetadataInputItem,
    NormalizedMetadataInputItem,
} from './types'

export const normalizeMetadataInputItem = (
    item: MetadataInputItem | string,
    existingMetadataMap: Map<string, MetadataItem>,
    key?: string
): NormalizedMetadataInputItem => {
    if (isPopulatedString(item)) {
        if (isPopulatedString(key)) {
            return {
                id: key,
                name: item,
            }
        } else {
            throw new Error(
                'Invalid metadata input: string value without a key'
            )
        }
    }

    const { id, uid, name, displayName, ...rest } = item

    // Prefer key because this has the nested version of the ID with the dot
    const resolvedId = key ?? uid ?? id

    if (!isPopulatedString(resolvedId)) {
        throw new Error('Invalid metadata input: no ID field present')
    }

    const resolvedName = displayName ?? name

    if (isPopulatedString(resolvedName)) {
        return { id: resolvedId, name: resolvedName, ...rest }
    } else if (
        existingMetadataMap.has(resolvedId) ||
        isOptionSetMetadataItem(item) ||
        isLegendSetMetadataItem(item)
    ) {
        /* Items that already exist in the store must have a name field
         * so for these we can send partial updates (objects with a name).
         * optionSets and legendSets are also valid without a name field
         * because they are mainly used as option/legend lookups for
         * DE and TEIs */
        return {
            id: resolvedId,
            ...rest,
        }
    } else if (!isMetadataInputItem(item)) {
        if ('id' in item && 'uid' in item) {
            throw new Error(
                'Invalid metadata input: item has both an id and uid'
            )
        } else {
            throw new Error('Invalid metadata input: name field not a string')
        }
    } else {
        throw new Error('Invalid metadata input: expected name field not found')
    }
}
