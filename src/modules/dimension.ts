import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from './validation'
import { TIME_DIMENSION_IDS } from '@constants/dimensions'
import {
    getDefaultOrgUnitLabel,
    getDefaultOrgUnitMetadata,
} from '@modules/metadata'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    DimensionRecord,
    DimensionType,
    OutputType,
    InternalDimensionRecord,
    SavedVisualization,
    TimeDimensionId,
    ValueType,
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

/**
 * Check if a dimension ID represents a status dimension (eventStatus or programStatus)
 */
export const isStatusDimension = (dimensionId: string): boolean => {
    const plainId = extractPlainDimensionId(dimensionId)
    return plainId === 'eventStatus' || plainId === 'programStatus'
}

/**
 * Check if a dimension ID represents a user dimension (createdBy or lastUpdatedBy)
 */
export const isUserDimension = (dimensionId: string): boolean => {
    const plainId = extractPlainDimensionId(dimensionId)
    return plainId === 'createdBy' || plainId === 'lastUpdatedBy'
}

/**
 * Check if a dimension type is a program-related dimension type
 */
export const isProgramDimensionType = (
    dimensionType: DimensionType | undefined
): boolean => {
    if (!dimensionType) {
        return false
    }
    return [
        'PROGRAM_DATA_ELEMENT',
        'CATEGORY',
        'CATEGORY_OPTION_GROUP_SET',
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
    ].includes(dimensionType)
}

/**
 * Check if a dimension type is a "your dimensions" type
 */
export const isYourDimensionType = (
    dimensionType: DimensionType | undefined
): boolean => {
    if (!dimensionType) {
        return false
    }
    return dimensionType === 'ORGANISATION_UNIT_GROUP_SET'
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
        return dimension as InternalDimensionRecord
    })

    if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(outputType)) {
        return dimensions
    }

    return dimensions.map((dimension) => {
        if (
            ['PROGRAM_DATA_ELEMENT', 'PERIOD'].includes(
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
            dimension.programId &&
            ((dimension.dimensionType || dimension.dimensionItemType) ===
                'ORGANISATION_UNIT' ||
                isStatusDimension(dimension.dimensionId))
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

type DimensionRecordObject = Partial<
    Record<DimensionId, InternalDimensionRecord>
>

export const getCreatedDimension = (): DimensionRecordObject => ({
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
        // No dimensionType - this is a special internal dimension identified by ID
        name: i18n.t('Created by'),
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        // No dimensionType - this is a special internal dimension identified by ID
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
        // No dimensionType - this is a special internal dimension identified by ID
        name: i18n.t('Event status'),
    },
    [prefixDimensionId('programStatus', programId)]: {
        id: prefixDimensionId('programStatus', programId),
        // No dimensionType - this is a special internal dimension identified by ID
        name: i18n.t('Program status'),
    },
})

/**
 * Transforms dimensions from API format to app format.
 *
 * IMPORTANT: This function changes the semantic type of dimensions:
 * - Input: dimensions with OpenApiDimensionType (e.g., PROGRAM_DATA_ELEMENT)
 * - Output: dimensions with DimensionType (e.g., DATA_ELEMENT)
 *
 * The return type is still DimensionArray, which accepts both types as a union.
 * This is technical debt - ideally this should return a TransformedDimensionArray type.
 *
 * Transformations:
 * - PROGRAM_DATA_ELEMENT → DATA_ELEMENT
 * - Legacy 'pe' dimension → appropriate time dimension based on outputType/timeField
 * - Filters out special dimensions (dy, latitude, longitude)
 */
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
                // PROGRAM_DATA_ELEMENT is a valid OpenAPI type but needs special handling
                // It represents a data element within a program context
                // Keep it as PROGRAM_DATA_ELEMENT rather than mapping to something else
                return dimensionObj
            }
            if (dimensionObj.dimension === 'pe') {
                return {
                    ...dimensionObj,
                    // TEI and pe (legacy visualization) should not normally happen
                    dimension: timeField
                        ? timeFieldTimeDimensionMap[timeField]
                        : outputTypeTimeDimensionMap[outputType],
                    dimensionType: 'PERIOD',
                }
            }
            return dimensionObj
        })
}

// Type guards
export const isTimeDimensionId = (
    dimensionId: DimensionRecord['dimension']
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)

type NameParentProperty = 'program' | 'stage'
type TimeDimension = {
    id: TimeDimensionId
    dimensionType: 'PERIOD'
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

export const combineAllDimensionsFromVisualization = (
    visualization: CurrentVisualization
): DimensionArray => [
    ...(visualization.columns || []),
    ...(visualization.rows || []),
    ...(visualization.filters || []),
]
