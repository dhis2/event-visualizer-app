export const isObject = (input: unknown): input is Record<string, unknown> => {
    return typeof input === 'object' && input !== null && !Array.isArray(input)
}

export const isPopulatedString = (input: unknown): input is string => {
    return typeof input === 'string' && input.trim().length > 0
}

/* Exhaustiveness guard: the default branch of an exhaustive switch narrows to
 * `never`, so a new unhandled union member fails to type-check here. */
export const assertNever = (value: never): never => {
    throw new Error(`Unhandled value: ${JSON.stringify(value)}`)
}
