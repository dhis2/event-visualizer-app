import i18n from '@dhis2/d2-i18n'
import type {
    DimensionMetadataItem,
    DimensionType,
    Program,
    ProgramStage,
} from '@types'

export const EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES: DimensionType[] = [
    'ORGANISATION_UNIT',
    'STATUS',
    'PERIOD',
] as const

export type EventWithRegistrationFixedDimensionType =
    (typeof EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES)[number]

// This offers some level of assurance that the card disabled state
// stays correct if fixed dimensions are added
type StageFixedDimension = Omit<DimensionMetadataItem, 'dimensionType'> & {
    dimensionType: EventWithRegistrationFixedDimensionType
}

export const getEventFixedDimensions = (
    program: Program,
    programStage: ProgramStage
): StageFixedDimension[] => {
    return [
        {
            id: `${programStage.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Event org. unit'),
            programId: program.id,
            programStageId: programStage.id,
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${programStage.id}.eventDate`,
            dimensionId: 'eventDate',
            dimensionType: 'PERIOD',
            name:
                programStage.displayExecutionDateLabel ?? i18n.t('Event date'),
            programId: program.id,
            programStageId: programStage.id,
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.scheduledDate`,
            dimensionId: 'scheduledDate',
            dimensionType: 'PERIOD',
            name: programStage.displayDueDateLabel ?? i18n.t('Scheduled date'),
            programId: program.id,
            programStageId: programStage.id,
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.eventStatus`,
            dimensionId: 'eventStatus',
            dimensionType: 'STATUS',
            name: i18n.t('Event status'),
            programId: program.id,
            programStageId: programStage.id,
            valueType: 'TEXT',
        },
    ]
}
