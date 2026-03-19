import {
    extractDimensionContextFromCompoundKey,
    isCompoundDimensionId,
    resolveKey,
} from './dimension'
import { isDimensionMetadataItem } from '@modules/metadata'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    MetadataInputItem,
    MetadataInputMap,
    NormalizedMetadataInputItem,
    MetadataMap,
} from '@types'

export const extractInputKey = (
    item: MetadataInputItem | string,
    key?: string
): string => {
    if (isPopulatedString(key)) {
        return key
    }
    const id = isObject(item) ? item.uid ?? item.id : undefined

    if (!id) {
        throw new Error('Invalid metadata input: no ID field present')
    }

    return id
}

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

    const { name, displayName, ...rest } = item
    delete rest.id
    delete rest.uid

    const inputKey = extractInputKey(item, key)

    // Canonicalize to 2-segment form if needed (3-segment → drop program prefix)
    const resolvedKey = isCompoundDimensionId(inputKey)
        ? resolveKey(inputKey)
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
        // Enrich with programId/programStageId from compound key context.
        const dimensionContext = isCompoundDimensionId(inputKey)
            ? extractDimensionContextFromCompoundKey(
                  inputKey,
                  existingMetadataMap
              )
            : { dimensionId: resolvedKey }
        Object.assign(resolvedItem, dimensionContext)
    }

    return resolvedItem
}

/**
 * Returns the set of canonical (normalized) keys that a metadata input map
 * would produce when added to the given metadata map. Uses the provided map
 * for compound ID resolution, so this should be called after context metadata
 * (programs, stages) has already been added.
 */
export const getCanonicalKeysForInput = (
    metadataInput: MetadataInputMap,
    existingMetadataMap: MetadataMap
): Set<string> => {
    const canonicalKeys = new Set<string>()
    for (const [key, value] of Object.entries(metadataInput)) {
        try {
            const normalized = normalizeMetadataInputItem(
                value as MetadataInputItem,
                existingMetadataMap,
                key
            )
            canonicalKeys.add(normalized.id)
        } catch {
            // If normalization fails, fall back to the raw input key
            canonicalKeys.add(key)
        }
    }
    return canonicalKeys
}
