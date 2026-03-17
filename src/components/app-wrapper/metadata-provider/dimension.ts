import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
} from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type { MetadataMap } from '@types'

export type DimensionIdentifier = {
    id: string
    programId?: string
    programStageId?: string
    repetitionIndex?: number
}

// Pattern to match repetition index like [0], [1], [-1] etc.
const REPETITION_INDEX_PATTERN = /\[(-?\d+)\]/

export const isCompoundDimensionId = (input: unknown): input is string =>
    isPopulatedString(input) && input.includes('.')

export const parseCompoundDimensionId = (
    compoundKey: string
): { ids: string[]; repetitionIndex?: number } => {
    if (!isPopulatedString(compoundKey)) {
        throw new Error('Dimension ID input is not a populated string')
    }

    // Extract repetition index pattern `[<integer>]` from anywhere in the input string (applies to programStage)
    const repetitionMatch = compoundKey.match(REPETITION_INDEX_PATTERN)
    const processedInput = repetitionMatch
        ? compoundKey.replace(REPETITION_INDEX_PATTERN, '')
        : compoundKey
    const repetitionIndex = repetitionMatch
        ? Number(repetitionMatch[1])
        : undefined
    const ids = processedInput.split('.')

    if (!isPopulatedString(ids[ids.length - 1])) {
        throw new Error(`No valid dimension ID found in "${compoundKey}"`)
    }

    if (ids.length < 1 || ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected 1-3 IDs, got ${ids.length}`
        )
    }

    if (ids.some((id) => !isPopulatedString(id))) {
        throw new Error(
            `Invalid dimension ID format: empty ID found in "${compoundKey}"`
        )
    }

    return { ids, repetitionIndex }
}

const getProgramStageIdWithRepetitionIndex = (
    programStageId: string,
    repetitionIndex?: number
) =>
    typeof repetitionIndex === 'number'
        ? `${programStageId}[${repetitionIndex}]`
        : programStageId

export const compoundIdToIdentifier = (
    compoundKey: string,
    metadataMap: MetadataMap
): DimensionIdentifier => {
    const { ids, repetitionIndex } = parseCompoundDimensionId(compoundKey)
    const plainDimensionId = ids.pop()

    if (!plainDimensionId) {
        throw new Error(`No valid dimension ID found in "${compoundKey}"`)
    }

    const identifier: DimensionIdentifier = {
        id: plainDimensionId,
    }

    if (typeof repetitionIndex === 'number') {
        identifier.repetitionIndex = repetitionIndex
    }

    if (ids.length === 2) {
        // If 2 IDs remain we know this must be a program and its stage
        identifier.programId = ids[0]
        identifier.programStageId = ids[1]
    } else if (ids.length === 1) {
        const unknownId = ids[0]
        const unknownMetadata = metadataMap.get(unknownId)

        if (unknownMetadata) {
            if (isProgramMetadataItem(unknownMetadata)) {
                identifier.programId = unknownId
                // If the program only has 1 stage we can use it
                if (unknownMetadata.programStages?.length === 1) {
                    identifier.programStageId =
                        unknownMetadata.programStages[0].id
                }
            } else if (isProgramStageMetadataItem(unknownMetadata)) {
                identifier.programStageId = unknownId
                identifier.programId =
                    unknownMetadata.program?.id ?? identifier.programId
            } else {
                throw new Error(
                    `Metadata item with ID "${unknownMetadata.id}" is not a program or program stage`
                )
            }
        } else {
            throw new Error(
                `No context metadata found for dimension with compound ID "${compoundKey}"`
            )
        }
    }

    if (!identifier.programStageId && typeof repetitionIndex === 'number') {
        throw new Error(
            `Invalid combination: repetitionIndex "${repetitionIndex}" but no programStage`
        )
    }

    return identifier
}

export const getCanonicalCompoundDimensionId = (
    identifier: DimensionIdentifier
): string => {
    if (!identifier.programStageId) {
        throw new Error(
            `Could not canonicalize dimension "${identifier.id}" without a program stage`
        )
    }

    return `${getProgramStageIdWithRepetitionIndex(
        identifier.programStageId,
        identifier.repetitionIndex
    )}.${identifier.id}`
}

export const normalizeCompoundDimensionId = (
    compoundKey: string,
    metadataMap: MetadataMap
): string => {
    const identifier = compoundIdToIdentifier(compoundKey, metadataMap)
    return getCanonicalCompoundDimensionId(identifier)
}

export const getCompoundDimensionIdVariants = (
    compoundKey: string,
    metadataMap: MetadataMap
): string[] => {
    const identifier = compoundIdToIdentifier(compoundKey, metadataMap)
    const canonicalKey = getCanonicalCompoundDimensionId(identifier)
    const aliases = computeCompoundIdAliasesFromDimensionIdentifier(identifier)

    return Array.from(new Set([canonicalKey, ...aliases]))
}

export const computeCompoundIdAliasesFromDimensionIdentifier = (
    identifier: DimensionIdentifier
) => {
    const { id, programId, programStageId, repetitionIndex } = identifier
    const compoundKeyAliases: string[] = []
    const programStageIdWithRepetition = programStageId
        ? getProgramStageIdWithRepetitionIndex(programStageId, repetitionIndex)
        : undefined

    if (programId && programStageId) {
        compoundKeyAliases.push(
            `${programId}.${programStageIdWithRepetition}.${id}`
        )
    }
    if (programStageId) {
        compoundKeyAliases.push(`${programStageIdWithRepetition}.${id}`)
    }
    if (programId) {
        compoundKeyAliases.push(`${programId}.${id}`)
    }

    return compoundKeyAliases
}
