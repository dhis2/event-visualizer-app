import { isMetadataInputItem } from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type {
    MetadataItem,
    MetadataInputItem,
    NormalizedMetadataInputItem,
} from '@types'

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
    } else if (existingMetadataMap.has(resolvedId)) {
        /* Items that already exist in the store must have a name field so
         * for these we can send partial updates (objects with a name). */
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
