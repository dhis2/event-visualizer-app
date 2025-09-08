export const INPUT_TYPES = ['EVENT', 'ENROLLMENT', 'TRACKED_ENTITY'] as const

export type InputType = (typeof INPUT_TYPES)[number]
