/**
 * Helper to create a type-safe array of string literals that is a subset of a given string literal type.
 *
 * Usage:
 *   const allowed = asStringLiteralSubsetArray<'foo' | 'bar' | 'baz'>()(['foo', 'baz'] as const)
 * This ensures:
 *   - Only values from the string literal type U are allowed in the array.
 *   - The resulting array is strongly typed as a readonly tuple of those values.
 */
export const asStringLiteralSubsetArray =
    <U extends string>() =>
    <T extends readonly U[]>(arr: T) =>
        arr
