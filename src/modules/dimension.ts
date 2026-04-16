import { TIME_DIMENSION_IDS } from '@constants/dimensions'
import i18n from '@dhis2/d2-i18n'
import {
    getDefaultOrgUnitLabel,
    getDefaultOrgUnitMetadata,
} from '@modules/metadata'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    DimensionMetadataItem,
    DimensionRecord,
    DimensionType,
    OutputType,
    Program,
    ProgramStage,
    TimeDimensionId,
    ValueType,
} from '@types'

export const outputTypeTimeDimensionMap: Record<OutputType, DimensionId> = {
    EVENT: 'eventDate',
    ENROLLMENT: 'enrollmentDate',
    TRACKED_ENTITY_INSTANCE: 'created',
}

// Mapping from the UPPER_SNAKE_CASE enum values that `timeField` can hold
// (backend source of truth: `TimeField.java` in dhis2-core) onto the
// concrete time-dimension id the app uses internally. Used when
// materialising a legacy `pe` dimension into a proper time dimension.
export const timeFieldTimeDimensionMap: Record<string, DimensionId> = {
    COMPLETED_DATE: 'completedDate',
    CREATED: 'created',
    ENROLLMENT_DATE: 'enrollmentDate',
    EVENT_DATE: 'eventDate',
    INCIDENT_DATE: 'incidentDate',
    LAST_UPDATED: 'lastUpdated',
    // OCCURRED_DATE is the newer tracker enum name for event date. Mapped
    // the same as EVENT_DATE; revisit if a semantic distinction emerges.
    OCCURRED_DATE: 'eventDate',
    SCHEDULED_DATE: 'scheduledDate',
}

// Full set of enum values the backend accepts for `timeField`. Derived from
// the map keys so the two cannot drift. Any value outside this set is
// treated by the backend as a custom data-element / attribute UID.
export const KNOWN_TIME_FIELD_VALUES: ReadonlySet<string> = new Set(
    Object.keys(timeFieldTimeDimensionMap)
)

export const getDimensionsWithSuffix = ({
    dimensionIds,
    metadata,
    outputType,
}) => {
    const dimensions = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id,
            outputType,
        })
        const dimension = {
            ...metadata[id],
            dimensionId,
            programStageId,
            programId,
        }

        if (!dimension.id) {
            dimension.id = id
        }
        return dimension as DimensionMetadataItem
    })

    if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(outputType)) {
        return dimensions
    }

    return dimensions.map((dimension) => {
        if (
            ['DATA_ELEMENT', 'PERIOD'].includes(
                dimension.dimensionType || dimension.dimensionItemType
            )
        ) {
            const duplicates = dimensions.filter(
                (d) =>
                    d.dimensionId === dimension.dimensionId &&
                    d !== dimension &&
                    ((dimension.programId && d.programId) ||
                        (dimension.programStageId && d.programStageId))
            )

            if (duplicates.length > 0) {
                const sameProgramId = duplicates.find(
                    (dup) => dup.programId === dimension.programId
                )
                const thirdPartyDuplicates = duplicates
                    .filter((dup) => dup.programId !== dimension.programId)
                    .find((dpid) =>
                        duplicates.find(
                            (dup) =>
                                dup.programStageId !== dpid.programStageId &&
                                dup.programId === dpid.programId
                        )
                    )

                if (sameProgramId || thirdPartyDuplicates) {
                    dimension.suffix = metadata[dimension.programStageId]?.name
                } else {
                    dimension.suffix = metadata[dimension.programId]?.name
                }
            }
        } else if (
            // always suffix ou and statuses for TE
            outputType === 'TRACKED_ENTITY_INSTANCE' &&
            ['ORGANISATION_UNIT', 'STATUS'].includes(
                dimension.dimensionType || dimension.dimensionItemType
            ) &&
            dimension.programId
        ) {
            dimension.suffix = metadata[dimension.programId]?.name
        }

        return dimension
    })
}

type GetDimensionIdPartsParams = {
    id: string
    outputType?: OutputType
}

export const getDimensionIdParts = ({
    id,
    outputType = undefined,
}: GetDimensionIdPartsParams): {
    dimensionId: string
    programStageId: string
    programId?: string
    repetitionIndex?: string
} => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || outputType !== 'TRACKED_ENTITY_INSTANCE') {
        rawStageId = part2
    }
    if (outputType === 'TRACKED_ENTITY_INSTANCE' && !part3) {
        programId = part2
    }
    const [programStageId, repetitionIndex] = (rawStageId || '').split('[')
    return {
        dimensionId,
        programStageId,
        ...(programId ? { programId } : {}),
        repetitionIndex:
            repetitionIndex?.length &&
            repetitionIndex.substring(0, repetitionIndex.indexOf(']')),
    }
}

type GetFullDimensionIdParams = {
    dimensionId: string
    outputType?: OutputType
    programId?: string
    programStageId?: string
}

export const getFullDimensionId = ({
    dimensionId,
    programId,
    programStageId,
    outputType,
}: GetFullDimensionIdParams): string => {
    return [
        outputType === 'TRACKED_ENTITY_INSTANCE' ? programId : undefined,
        programStageId,
        dimensionId,
    ]
        .filter(Boolean)
        .join('.')
}

type DimensionRecordObject = Partial<Record<DimensionId, DimensionMetadataItem>>

export const getCreatedDimension = (): Partial<
    Record<DimensionId, DimensionMetadataItem>
> => ({
    created: {
        id: 'created',
        dimensionId: 'created',
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
        valueType: 'DATE',
    },
})

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
        valueType: 'USERNAME',
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        dimensionId: 'lastUpdatedBy',
        dimensionType: 'USER',
        name: i18n.t('Last updated by'),
        valueType: 'USERNAME',
    },
})

const prefixDimensionId = (dimensionId: string, prefix?: string): string =>
    prefix ? `${prefix}.${dimensionId}` : dimensionId

export const getProgramDimensions = (
    programId?: string
): DimensionRecordObject => ({
    [prefixDimensionId('ou', programId)]: {
        id: prefixDimensionId('ou', programId),
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(),
    },
    [prefixDimensionId('eventStatus', programId)]: {
        id: prefixDimensionId('eventStatus', programId),
        dimensionType: 'STATUS',
        name: i18n.t('Event status'),
    },
    [prefixDimensionId('programStatus', programId)]: {
        id: prefixDimensionId('programStatus', programId),
        dimensionType: 'STATUS',
        name: i18n.t('Program status'),
    },
})

export const transformDimensions = (
    dimensions: DimensionArray
): DimensionArray =>
    dimensions
        .filter(
            (dimensionObj) =>
                !['dy', 'latitude', 'longitude'].includes(
                    dimensionObj.dimension
                )
        )
        .map((dimensionObj) => {
            if (dimensionObj.dimensionType === 'PROGRAM_DATA_ELEMENT') {
                return {
                    ...dimensionObj,
                    dimensionType: 'DATA_ELEMENT',
                }
            }
            return dimensionObj
        })

export const isTimeDimensionId = (
    dimensionId: DimensionRecord['dimension']
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)

type NameParentProperty = 'program' | 'stage'
type TimeDimension = {
    id: TimeDimensionId
    dimensionType: DimensionType
    formatType: ValueType
    defaultName: string
    nameParentProperty: NameParentProperty
    nameProperty: string
}
export const getTimeDimensions = (): Record<
    Exclude<TimeDimensionId, 'created' | 'lastUpdated'>,
    TimeDimension
> => ({
    completedDate: {
        id: 'completedDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Completed date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayCompletedDateLabel',
        formatType: 'DATE',
    },
    createdDate: {
        id: 'createdDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Created date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayCreatedDateLabel',
        formatType: 'DATE',
    },
    eventDate: {
        id: 'eventDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Event date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayExecutionDateLabel',
        formatType: 'DATE',
    },
    enrollmentDate: {
        id: 'enrollmentDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Enrollment date'),
        nameParentProperty: 'program',
        nameProperty: 'displayEnrollmentDateLabel',
        formatType: 'DATE',
    },
    incidentDate: {
        id: 'incidentDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Incident date'),
        nameParentProperty: 'program',
        nameProperty: 'displayIncidentDateLabel',
        formatType: 'DATE',
    },
    lastUpdatedOn: {
        id: 'lastUpdatedOn',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Last updated on'),
        nameParentProperty: 'stage',
        nameProperty: 'displayLastUpdatedOnLabel',
        formatType: 'DATE',
    },
    scheduledDate: {
        id: 'scheduledDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Scheduled date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayDueDateLabel',
        formatType: 'DATE',
    },
})

export const getTimeDimensionName = (
    dimension: TimeDimension,
    program?: Program,
    stage?: ProgramStage
): string => {
    if (!dimension.nameParentProperty || !program) {
        return dimension.defaultName
    }
    const name =
        dimension.nameParentProperty === 'program'
            ? program[dimension.nameProperty]
            : stage?.[dimension.nameProperty]

    return name || dimension.defaultName
}

export const getUiDimensionType = (
    dimensionId: DimensionId | string,
    dimensionType: DimensionType | 'PROGRAM_DATA_ELEMENT'
): DimensionType => {
    if (dimensionType === 'PROGRAM_DATA_ELEMENT') {
        return 'DATA_ELEMENT'
    }
    switch (dimensionId) {
        case 'programStatus':
        case 'eventStatus':
            return 'STATUS'

        case 'createdBy':
        case 'lastUpdatedBy':
            return 'USER'

        default:
            return dimensionType
    }
}

export const combineAllDimensionsFromVisualization = (
    visualization: CurrentVisualization
): DimensionArray => [
    ...(visualization.columns || []),
    ...(visualization.rows || []),
    ...(visualization.filters || []),
]

// ---------------------------------------------------------------------------
// Fixed dimension builders — shared between sidebar and metadata provider.
// These are the canonical source of truth for fixed dimension names.
// ---------------------------------------------------------------------------

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
        id: `${program.id}.ou`,
        dimensionId: 'ou',
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
        id: `${trackedEntityType.id}.ou`,
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        trackedEntityTypeId: trackedEntityType.id,
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${trackedEntityType.id}.created`,
        dimensionId: 'created',
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
        trackedEntityTypeId: trackedEntityType.id,
        valueType: 'DATE',
    },
]
