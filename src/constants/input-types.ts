export const SUPPORTED_INPUT_TYPES = [
    'INPUT_TYPE_EVENT',
    'INPUT_TYPE_ENROLLMENT',
    'INPUT_TYPE_TRACKED_ENTITY',
] as const

export type InputType = (typeof SUPPORTED_INPUT_TYPES)[number]
