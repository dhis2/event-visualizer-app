import i18n from '@dhis2/d2-i18n'
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
    DimensionRecord,
    ExtendedDimensionType,
    InputType,
    InternalDimensionRecord,
    ProgramDimensionType,
    TimeDimensionId,
    YourDimensionType,
} from '@types'

export const getDimensionsWithSuffix = ({
    dimensionIds,
    metadata,
    inputType,
}) => {
    const dimensions = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id,
            inputType,
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

    if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(inputType)) {
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
            inputType === 'TRACKED_ENTITY_INSTANCE' &&
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
    inputType: InputType
}

export const getDimensionIdParts = ({
    id,
    inputType,
}: GetDimensionIdPartsParams): {
    dimensionId: string
    programStageId: string
    programId?: string
    repetitionIndex?: string
} => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || inputType !== 'TRACKED_ENTITY_INSTANCE') {
        rawStageId = part2
    }
    if (inputType === 'TRACKED_ENTITY_INSTANCE' && !part3) {
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
    programId?: string
    programStageId?: string
    inputType: InputType
}

export const getFullDimensionId = ({
    dimensionId,
    programId,
    programStageId,
    inputType,
}: GetFullDimensionIdParams): string => {
    return [
        inputType === 'TRACKED_ENTITY_INSTANCE' ? programId : undefined,
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
    inputType: InputType
): DimensionRecordObject => ({
    ...(inputType === 'TRACKED_ENTITY_INSTANCE'
        ? {
              ...getDefaultOrgUnitMetadata(inputType),
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

const prefixDimensionId = (prefix: string, dimensionId: string): string =>
    prefix ? `${prefix}.${dimensionId}` : dimensionId

export const getProgramDimensions = (
    programId: string
): DimensionRecordObject => ({
    [prefixDimensionId(programId, 'ou')]: {
        id: prefixDimensionId(programId, 'ou'),
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(),
    },
    [prefixDimensionId(programId, 'eventStatus')]: {
        id: prefixDimensionId(programId, 'eventStatus'),
        dimensionType: 'STATUS',
        name: i18n.t('Event status'),
    },
    [prefixDimensionId(programId, 'programStatus')]: {
        id: prefixDimensionId(programId, 'programStatus'),
        dimensionType: 'STATUS',
        name: i18n.t('Program status'),
    },
})

export const transformDimensions = (
    dimensions: DimensionArray,
    visualization: CurrentVisualization
): DimensionArray => {
    const { outputType: inputType, type } = visualization

    const inputTypeTimeDimensionMap: Record<InputType, DimensionId> = {
        EVENT: 'eventDate',
        ENROLLMENT: 'enrollmentDate',
        TRACKED_ENTITY_INSTANCE: 'created',
    }

    return dimensions
        .filter(
            (dimensionObj) =>
                !['longitude', 'latitude'].includes(dimensionObj.dimension)
        )
        .map((dimensionObj) => {
            if (dimensionObj.dimensionType === 'PROGRAM_DATA_ELEMENT') {
                return {
                    ...dimensionObj,
                    dimensionType: 'DATA_ELEMENT',
                }
            } else if (
                dimensionObj.dimension === 'pe' &&
                type === 'LINE_LIST' // TODO: this should be always the case as this function is only used for LL visualizations
            ) {
                return {
                    ...dimensionObj,
                    // TEI and pe (legacy visualization) should not normally happen
                    dimension: inputTypeTimeDimensionMap[inputType],
                    dimensionType: 'PERIOD',
                }
            } else {
                return dimensionObj
            }
        })
}

// Type guards
export const isProgramDimensionType = (
    dimensionType: ExtendedDimensionType
): dimensionType is ProgramDimensionType =>
    (PROGRAM_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

export const isYourDimensionType = (
    dimensionType: ExtendedDimensionType
): dimensionType is YourDimensionType =>
    (YOUR_DIMENSION_TYPES as readonly string[]).includes(dimensionType)

export const isTimeDimensionId = (
    dimensionId: DimensionRecord['dimension']
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)
