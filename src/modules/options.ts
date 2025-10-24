type OptionDef = {
    defaultValue: unknown
    persisted: boolean
}

export const options: Record<string, OptionDef> = {
    completedOnly: {
        defaultValue: false,
        persisted: true,
    },
    skipRounding: {
        defaultValue: false,
        persisted: true,
    },
}

export const getAllOptions = (): Record<string, OptionDef> => options

// This for now has only the 2 options that can be passed to the analytics request
export const getOptionsForRequest = (): [string, OptionDef][] =>
    Object.entries(getAllOptions())
