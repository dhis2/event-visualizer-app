import i18n from '@dhis2/d2-i18n'
import { getDefaultOrgUnitMetadata } from '@modules/metadata/org-unit'
import type {
    DimensionId,
    DimensionMetadataItem,
    OutputType,
    Program,
    ProgramStage,
} from '@types'

type DimensionRecordObject = Partial<Record<DimensionId, DimensionMetadataItem>>

export const getCreatedDimension = (): Partial<
    Record<DimensionId, DimensionMetadataItem>
> => ({
    created: {
        id: 'created',
        dimensionId: 'created',
        dimensionType: 'PERIOD',
        name: i18n.t('Created on'),
        valueType: 'DATE',
    },
})

export const getFixedMetaDimensions = (): DimensionMetadataItem[] => [
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
    },
    {
        id: 'completed',
        dimensionId: 'completed',
        name: i18n.t('Completed on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
]

export const getMainDimensions = (
    outputType: OutputType
): DimensionRecordObject => ({
    ...(outputType === 'TRACKED_ENTITY_INSTANCE'
        ? {
              ...getDefaultOrgUnitMetadata(outputType),
              ...getCreatedDimension(),
          }
        : {}),
    lastUpdated: {
        id: 'lastUpdated',
        dimensionId: 'lastUpdated',
        dimensionType: 'PERIOD',
        name: i18n.t('Last updated on'),
        valueType: 'DATETIME',
    },
    createdBy: {
        id: 'createdBy',
        dimensionId: 'createdBy',
        dimensionType: 'USER',
        name: i18n.t('Created by'),
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        dimensionId: 'lastUpdatedBy',
        dimensionType: 'USER',
        name: i18n.t('Last updated by'),
    },
})

/* ---------------------------------------------------------------------------
 * Fixed dimension builders — shared between sidebar and metadata provider.
 * These are the canonical source of truth for fixed dimension names.
 * --------------------------------------------------------------------------- */

export const getStageFixedDimensions = (
    program: Program,
    programStage: ProgramStage
): DimensionMetadataItem[] => [
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
        name: programStage.displayExecutionDateLabel ?? i18n.t('Event date'),
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

export const getEnrollmentFixedDimensions = (
    program: Program
): DimensionMetadataItem[] => [
    {
        id: `${program.id}.enrollmentOu`,
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        name: program.displayOrgUnitLabel ?? i18n.t('Enrollment org. unit'),
        programId: program.id,
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${program.id}.enrollmentDate`,
        dimensionId: 'enrollmentDate',
        dimensionType: 'PERIOD',
        name:
            program.displayEnrollmentDateLabel ?? i18n.t('Date of enrollment'),
        programId: program.id,
        valueType: 'DATE',
    },
    {
        id: `${program.id}.incidentDate`,
        dimensionId: 'incidentDate',
        dimensionType: 'PERIOD',
        name: program.displayIncidentDateLabel ?? i18n.t('Incident date'),
        programId: program.id,
        valueType: 'DATE',
    },
    {
        id: `${program.id}.programStatus`,
        dimensionId: 'programStatus',
        dimensionType: 'STATUS',
        name: i18n.t('Enrollment status'),
        programId: program.id,
        valueType: 'TEXT',
    },
]

export const getTrackedEntityTypeFixedDimensions = (trackedEntityType: {
    id: string
}): DimensionMetadataItem[] => [
    {
        id: `${trackedEntityType.id}.enrollmentOu`,
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        trackedEntityTypeId: trackedEntityType.id,
        valueType: 'ORGANISATION_UNIT',
    },
]
