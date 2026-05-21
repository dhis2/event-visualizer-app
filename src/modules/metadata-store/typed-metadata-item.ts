import type { MetadataItem } from '@types'

/**
 * Asserts that a metadata item matches a specific type guard, throwing if
 * the item is present but of the wrong type. Returns `undefined` silently
 * when the item is absent.
 */
export const assertTypedMetadataItem = <T extends MetadataItem>(
    item: MetadataItem | undefined,
    guard: (item: MetadataItem) => item is T,
    errorMessage: string
): T | undefined => {
    if (item && !guard(item)) {
        throw new Error(errorMessage)
    }
    return item && guard(item) ? item : undefined
}
