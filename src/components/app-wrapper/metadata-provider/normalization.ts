import {
    extractDimensionContextFromCompoundKey,
    isCompoundDimensionId,
    resolveId,
} from './dimension'
import { isDimensionMetadataItem } from '@modules/metadata'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    MetadataInputItem,
    MetadataInputMap,
    NormalizedMetadataInputItem,
    MetadataMap,
} from '@types'

export const extractInputId = (
    item: MetadataInputItem | string,
    key?: string
): string => {
    if (isPopulatedString(key)) {
        return key
    }
    const itemId = isObject(item) ? item.uid ?? item.id : undefined

    if (!itemId) {
        throw new Error('Invalid metadata input: no ID field present')
    }

    return itemId
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
                'Invalid metadata input: string value without an ID'
            )
        }
    }

    const { name, displayName, ...rest } = item
    delete rest.id
    delete rest.uid

    const inputId = extractInputId(item, key)

    // Canonicalize to 2-segment form if needed (3-segment → drop program prefix)
    const canonicalId = isCompoundDimensionId(inputId)
        ? resolveId(inputId)
        : inputId
    const existingItem = existingMetadataMap.get(canonicalId)
    const resolvedName = displayName ?? name ?? existingItem?.name

    if (!resolvedName) {
        throw new Error(
            `New metadata item "${canonicalId}" does not have a name`
        )
    }

    const resolvedItem = {
        id: canonicalId,
        name: resolvedName,
        ...rest,
    }

    if (isDimensionMetadataItem(resolvedItem)) {
        // Enrich with programId/programStageId from compound ID context.
        const dimensionContext = isCompoundDimensionId(inputId)
            ? extractDimensionContextFromCompoundKey(
                  inputId,
                  existingMetadataMap
              )
            : { dimensionId: canonicalId }
        Object.assign(resolvedItem, dimensionContext)
    }

    return resolvedItem
}

/**
 * Returns the set of canonical (normalized) IDs that a metadata input map
 * would produce when added to the given metadata map. Uses the provided map
 * for compound ID resolution, so this should be called after context metadata
 * (programs, stages) has already been added.
 */
export const getCanonicalKeysForInput = (
    metadataInput: MetadataInputMap,
    existingMetadataMap: MetadataMap
): Set<string> => {
    const canonicalIds = new Set<string>()
    for (const [id, value] of Object.entries(metadataInput)) {
        try {
            const normalized = normalizeMetadataInputItem(
                value as MetadataInputItem,
                existingMetadataMap,
                id
            )
            canonicalIds.add(normalized.id)
        } catch {
            // If normalization fails, fall back to the raw input ID
            canonicalIds.add(id)
        }
    }
    return canonicalIds
}
