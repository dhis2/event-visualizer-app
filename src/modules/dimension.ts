import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from './validation'
import {
    PROGRAM_DIMENSION_TYPES,
    TIME_DIMENSION_IDS,
    YOUR_DIMENSION_TYPES,
} from '@constants/dimensions'
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
    ProgramDimensionType,
    SavedVisualization,
    TimeDimensionId,
    ValueType,
    YourDimensionType,
} from '@types'

export const extractPlainDimensionId = (input: string): string => {
    if (!isPopulatedString(input)) {
        throw new Error('Input is not a populated string')
    }
    const dimensionId = input.split('.').pop()

    if (!isPopulatedString(dimensionId)) {
        throw new Error(`Input "${input}" does not contain a dimension ID`)
    }
    return dimensionId
}

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
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
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
        dimensionType: 'PERIOD',
        name: i18n.t('Last updated on'),
    },
    createdBy: {
        id: 'createdBy',
        dimensionType: 'USER',
        name: i18n.t('Created by'),
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        dimensionType: 'USER',
        name: i18n.t('Last updated by'),
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
    dimensions: DimensionArray,
    visualization: CurrentVisualization
): DimensionArray => {
    const { outputType, timeField } = visualization

    const outputTypeTimeDimensionMap: Record<OutputType, DimensionId> = {
        EVENT: 'eventDate',
        ENROLLMENT: 'enrollmentDate',
        TRACKED_ENTITY_INSTANCE: 'created',
    }

    const timeFieldTimeDimensionMap: Record<
        string, // XXX: SavedVisualization['timeField'] is optional
        DimensionId
    > = {
        COMPLETED_DATE: 'completedDate',
        CREATED: 'created',
        ENROLLMENT_DATE: 'enrollmentDate',
        INCIDENT_DATE: 'incidentDate',
        LAST_UPDATED: 'lastUpdated',
        SCHEDULED_DATE: 'scheduledDate',
    }

    return dimensions
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
            } else if (dimensionObj.dimension === 'pe') {
                return {
                    ...dimensionObj,
                    // TEI and pe (legacy visualization) should not normally happen
                    dimension: timeField
                        ? timeFieldTimeDimensionMap[timeField]
                        : outputTypeTimeDimensionMap[outputType],
                    dimensionType: 'PERIOD',
                }
            } else {
                return dimensionObj
            }
        })
}

// Type guards
export const isProgramDimensionType = (
    dimensionType: DimensionType
): dimensionType is ProgramDimensionType =>
    (PROGRAM_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

export const isYourDimensionType = (
    dimensionType: DimensionType
): dimensionType is YourDimensionType =>
    (YOUR_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

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
    program?: SavedVisualization['program'],
    stage?: SavedVisualization['programStage']
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
    dimensionType: DimensionType
): DimensionType => {
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
