export const options: [
    string,
    { defaultValue: unknown; requestable?: boolean; saveable?: boolean }
][] = [
    [
        'skipRounding',
        {
            defaultValue: false,
            requestable: true,
            saveable: true,
        },
    ],
    [
        'displayDensity',
        {
            defaultValue: 'NORMAL',
            requestable: false,
            saveable: true,
        },
    ],
    [
        'fontSize',
        {
            defaultValue: 'NORMAL',
            requestable: false,
            saveable: true,
        },
    ],
    [
        'digitGroupSeparator',
        {
            defaultValue: 'SPACE',
            requestable: false,
            saveable: true,
        },
    ],
    [
        'showHierarchy',
        {
            defaultValue: false,
            requestable: false,
            saveable: true,
        },
    ],
]

export const getOptionsForRequest = (): [
    string,
    { defaultValue: unknown; requestable?: boolean; saveable?: boolean }
][] => [
    [
        'completedOnly',
        { defaultValue: false, requestable: false, saveable: false },
    ], // TODO - is completedOnly an option?
    ...options,
]
