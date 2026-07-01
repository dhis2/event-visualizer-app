import type { DimensionMetadataItem, DimensionType } from '@types'

export const EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES: DimensionType[] = [
    'ORGANISATION_UNIT',
    'STATUS',
    'PERIOD',
] as const

export type EventWithRegistrationFixedDimensionType =
    (typeof EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES)[number]

// This offers some level of assurance that the card disabled state
// stays correct if fixed dimensions are added
export type StageFixedDimension = Omit<
    DimensionMetadataItem,
    'dimensionType'
> & {
    dimensionType: EventWithRegistrationFixedDimensionType
}

export { getStageFixedDimensions as getEventFixedDimensions } from '@modules/dimension/fixed'
