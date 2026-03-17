import { compoundIdToIdentifier, isCompoundDimensionId } from './dimension'
import { isDimensionMetadataItem, isMetadataInputItem } from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type {
    MetadataInputItem,
    NormalizedMetadataInputItem,
    MetadataMap,
    DimensionMetadataItem,
} from '@types'

export const transformDimensionItemWithCompoundId = (
    item: MetadataInputItem,
    existingMetadataMap: MetadataMap
): DimensionMetadataItem => {
    if (!isDimensionMetadataItem(item)) {
        throw new Error(
            'Item with compound ID does not qualify as a dimension metadata item'
        )
    }
    const identifier = compoundIdToIdentifier(item.id!, existingMetadataMap)
    const transformedItem: DimensionMetadataItem = {
        ...item,
        id: identifier.id,
    }

    if (identifier.programId) {
        transformedItem.program = identifier.programId
    }

    if (identifier.programStageId) {
        transformedItem.programStage = identifier.programStageId
    }

    if (identifier.repetitionIndex) {
        transformedItem.repetitionIndex = identifier.repetitionIndex
    }

    return transformedItem
}

export const normalizeMetadataInputItem = (
    item: MetadataInputItem | string,
    existingMetadataMap: MetadataMap,
    key?: string
): { key: string; item: NormalizedMetadataInputItem } => {
    if (isPopulatedString(item)) {
        if (isPopulatedString(key)) {
            return {
                key,
                item: {
                    id: key,
                    name: item,
                },
            }
        } else {
            throw new Error(
                'Invalid metadata input: string value without a key'
            )
        }
    }

    const { id, uid, name, displayName, ...rest } = item

    // Prefer key because this has the nested version of the ID with the dot
    const resolvedKey = key ?? uid ?? id

    if (!isPopulatedString(resolvedKey)) {
        throw new Error('Invalid metadata input: no ID field present')
    }

    const resolvedName = displayName ?? name
    const exitistingItem = existingMetadataMap.get(resolvedKey)

    if (isPopulatedString(resolvedName)) {
        const resolvedItem = { id: resolvedKey, name: resolvedName, ...rest }

        return {
            key: resolvedKey,
            item: isCompoundDimensionId(resolvedKey)
                ? transformDimensionItemWithCompoundId(
                      resolvedItem,
                      existingMetadataMap
                  )
                : resolvedItem,
        }
    } else if (exitistingItem) {
        /* Items that already exist in the store must have a name field so
         * for these we can send partial updates (objects with a name). */
        return {
            key: resolvedKey,
            item: {
                id: exitistingItem.id,
                ...rest,
            },
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
