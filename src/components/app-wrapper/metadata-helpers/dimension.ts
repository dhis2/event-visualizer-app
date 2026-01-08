import { isPopulatedString } from './type-guards'

// Pattern to match repetition index like [0], [1], [-1] etc.
const REPETITION_INDEX_PATTERN = /\[(-?\d+)\]/

export const parseDimensionIdInput = (
    input: string
): { ids: string[]; repetitionIndex?: string } => {
    if (!isPopulatedString(input)) {
        throw new Error('Dimension ID input is not a populated string')
    }

    // Extract repetition index pattern `[<integer>]` from anywhere in the input string (applies to programStage)
    const repetitionMatch = input.match(REPETITION_INDEX_PATTERN)
    const processedInput = repetitionMatch
        ? input.replace(REPETITION_INDEX_PATTERN, '')
        : input
    const repetitionIndex = repetitionMatch?.[1]
    const ids = processedInput.split('.')

    if (!isPopulatedString(ids[ids.length - 1])) {
        throw new Error(`No valid dimension ID found in "${input}"`)
    }

    if (ids.length < 1 || ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected 1-3 IDs, got ${ids.length}`
        )
    }

    if (ids.some((id) => !isPopulatedString(id))) {
        throw new Error(
            `Invalid dimension ID format: empty ID found in "${input}"`
        )
    }

    return { ids, repetitionIndex }
}
