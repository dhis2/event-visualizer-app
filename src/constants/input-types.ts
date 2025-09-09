export const INPUT_TYPES = [
    'EVENT',
    'ENROLLMENT',
    'TRACKED_ENTITY_INSTANCE',
] as const

export type SupportedInputType = (typeof INPUT_TYPES)[number]
