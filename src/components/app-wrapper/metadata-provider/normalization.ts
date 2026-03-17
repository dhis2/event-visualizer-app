import {
    compoundIdToIdentifier,
    getCanonicalCompoundDimensionId,
    isCompoundDimensionId,
} from './dimension'
import { isDimensionMetadataItem } from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type {
    MetadataInputItem,
    NormalizedMetadataInputItem,
    MetadataMap,
} from '@types'

export const normalizeMetadataInputItem = (
    item: MetadataInputItem | string,
    existingMetadataMap: MetadataMap,
    key?: string
): NormalizedMetadataInputItem => {
    if (isPopulatedString(item)) {
        if (isPopulatedString(key)) {
            return { id: key, name: item }
        } else {
            throw new Error(
                'Invalid metadata input: string value without a key'
            )
        }
    }

    const { id, uid, name, displayName, ...rest } = item

    // Prefer key because this has the nested version of the ID with the dot
    const inputKey = key ?? uid ?? id

    if (!isPopulatedString(inputKey)) {
        throw new Error('Invalid metadata input: no ID field present')
    }

    const compoundIdentifier = isCompoundDimensionId(inputKey)
        ? compoundIdToIdentifier(inputKey, existingMetadataMap)
        : undefined
    const resolvedKey = compoundIdentifier
        ? getCanonicalCompoundDimensionId(compoundIdentifier)
        : inputKey
    const existingItem = existingMetadataMap.get(resolvedKey)
    const resolvedName = displayName ?? name ?? existingItem?.name

    if (!resolvedName) {
        throw new Error(
            `New metadata item "${resolvedKey}" does not have a name`
        )
    }

    const resolvedItem = {
        id: resolvedKey,
        name: resolvedName,
        ...rest,
    }

    if (isDimensionMetadataItem(resolvedItem)) {
        Object.assign(
            resolvedItem,
            compoundIdentifier ?? { dimensionId: resolvedKey }
        )
    }

    return resolvedItem
}
