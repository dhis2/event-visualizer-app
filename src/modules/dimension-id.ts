import type { SupportedInputType } from '@constants/input-types'

interface GetDimensionIdPartsParams {
    id: string
    inputType: SupportedInputType
}
export const getDimensionIdParts = ({
    id,
    inputType,
}: GetDimensionIdPartsParams) => {
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

interface GetFullDimensionIdParams {
    dimensionId: string
    inputType: SupportedInputType
    programId?: string
    programStageId?: string
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
        .filter((p) => p)
        .join('.')
}
