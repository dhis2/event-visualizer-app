export const options: {
    [key: string]: {
        defaultValue: unknown
        persisted: boolean
    }
} = {
    completedOnly: {
        defaultValue: false,
        persisted: true,
    },
    skipRounding: {
        defaultValue: false,
        persisted: true,
    },
}

// This for now has only the 2 options that can be passed to the analytics request
export const getOptionsForRequest = (): [string, { defaultValue: unknown }][] =>
    Object.entries(options)
