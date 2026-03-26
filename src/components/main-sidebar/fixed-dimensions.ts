import i18n from '@dhis2/d2-i18n'
import type {
    DataSourceProgramWithRegistration,
    DataSourceProgramWithoutRegistration,
    DimensionMetadataItem,
    DimensionType,
    MetadataItem,
    Program,
    ProgramStage,
} from '@types'

/* cards-program-without-registration and cards-program-with-registration
 * (also used by ProgramStageSubsection) */

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
    program: Program | DataSourceProgramWithoutRegistration,
    programStage: ProgramStage
): StageFixedDimension[] => {
    return [
        {
            id: `${programStage.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Event org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${programStage.id}.eventDate`,
            dimensionId: 'eventDate',
            dimensionType: 'PERIOD',
            name:
                programStage.displayExecutionDateLabel ?? i18n.t('Event date'),
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.scheduledDate`,
            dimensionId: 'scheduledDate',
            dimensionType: 'PERIOD',
            name: programStage.displayDueDateLabel ?? i18n.t('Scheduled date'),
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.eventStatus`,
            dimensionId: 'eventStatus',
            dimensionType: 'STATUS',
            name: i18n.t('Event status'),
            valueType: 'TEXT',
        },
    ]
}

// cards-program-with-registration

export const getEnrollmentFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => {
    return [
        {
            id: `${program.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Enrollment org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${program.id}.enrollmentDate`,
            dimensionId: 'enrollmentDate',
            dimensionType: 'PERIOD',
            name:
                program.displayEnrollmentDateLabel ??
                i18n.t('Date of enrollment'),
            valueType: 'DATE',
        },
        {
            id: `${program.id}.incidentDate`,
            dimensionId: 'incidentDate',
            dimensionType: 'PERIOD',
            name: program.displayIncidentDateLabel ?? i18n.t('Incident date'),
            valueType: 'DATE',
        },
        {
            id: `${program.id}.programStatus`,
            dimensionId: 'programStatus',
            dimensionType: 'STATUS',
            name: i18n.t('Enrollment status'),
            valueType: 'TEXT',
        },
    ]
}

// permanent cards (always visible, not tied to a data source)

export const getMetadataFixedDimensions = (): DimensionMetadataItem[] => [
    {
        id: 'lastUpdated',
        dimensionId: 'lastUpdated',
        name: i18n.t('Last updated on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'lastUpdatedBy',
        dimensionId: 'lastUpdatedBy',
        name: i18n.t('Last updated by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'created',
        dimensionId: 'created',
        name: i18n.t('Created on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'createdBy',
        dimensionId: 'createdBy',
        name: i18n.t('Created by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'completed',
        dimensionId: 'completed',
        name: i18n.t('Completed on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
]

export const METADATA_DIMENSION_IDS = new Set(
    getMetadataFixedDimensions().map((dimension) => dimension.id)
)

export const getTrackedEntityTypeWithRegFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => [
    {
        id: `${program.trackedEntityType.id}.ou`,
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        valueType: 'ORGANISATION_UNIT',
    },
]

// cards-tracked-entity-type

export const getTetFixedDimensions = (
    trackedEntityType: MetadataItem
): DimensionMetadataItem[] => {
    return [
        {
            id: `${trackedEntityType.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: i18n.t('Registration org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${trackedEntityType.id}.created`,
            dimensionId: 'created',
            dimensionType: 'PERIOD',
            name: i18n.t('Registration date'),
            valueType: 'DATE',
        },
    ]
}
