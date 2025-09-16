// This for now has only the 2 options that can be passed to the analytics request
export const getOptionsForRequest = (): [
    string,
    { defaultValue: unknown }
][] => [
    ['completedOnly', { defaultValue: false }],
    [
        'skipRounding',
        {
            defaultValue: false,
        },
    ],
]
