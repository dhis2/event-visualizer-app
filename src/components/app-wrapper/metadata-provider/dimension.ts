import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
} from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type { DimensionMetadataItem, MetadataMap } from '@types'

export type DimensionIdentifier = Pick<
    DimensionMetadataItem,
    'dimensionId' | 'programId' | 'programStageId' | 'repetitionIndex'
>

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
    const repetitionMatch = REPETITION_INDEX_PATTERN.exec(compoundKey)
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

    if (ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected at most 3 IDs, got ${ids.length}`
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

type ResolveIdentifierFromContextMetadataArgs = {
    unknownId: string
    compoundKey: string
    identifier: DimensionIdentifier
    metadataMap: MetadataMap
}

const resolveIdentifierFromContextMetadata = ({
    unknownId,
    compoundKey,
    identifier,
    metadataMap,
}: ResolveIdentifierFromContextMetadataArgs): void => {
    const unknownMetadata = metadataMap.get(unknownId)

    if (!unknownMetadata) {
        throw new Error(
            `No context metadata found for dimension with compound ID "${compoundKey}"`
        )
    }

    if (isProgramMetadataItem(unknownMetadata)) {
        identifier.programId = unknownId
        /* Event programs (WITHOUT_REGISTRATION) always have exactly one
         * stage in the data model, so we can safely use it. Tracker
         * programs (WITH_REGISTRATION) may have many stages, in which
         * case the compound ID must include the stage explicitly. */
        if (unknownMetadata.programStages?.length === 1) {
            identifier.programStageId = unknownMetadata.programStages[0].id
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
}

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
        dimensionId: plainDimensionId,
    }

    if (typeof repetitionIndex === 'number') {
        identifier.repetitionIndex = repetitionIndex
    }

    if (ids.length === 2) {
        // If 2 IDs remain we know this must be a program and its stage
        identifier.programId = ids[0]
        identifier.programStageId = ids[1]
    } else if (ids.length === 1) {
        resolveIdentifierFromContextMetadata({
            unknownId: ids[0],
            compoundKey,
            identifier,
            metadataMap,
        })
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
            `Could not canonicalize dimension "${identifier.dimensionId}" without a program stage`
        )
    }

    return `${getProgramStageIdWithRepetitionIndex(
        identifier.programStageId,
        identifier.repetitionIndex
    )}.${identifier.dimensionId}`
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
    const { dimensionId, programId, programStageId, repetitionIndex } =
        identifier
    const compoundKeyAliases: string[] = []
    const programStageIdWithRepetition = programStageId
        ? getProgramStageIdWithRepetitionIndex(programStageId, repetitionIndex)
        : undefined

    if (programId && programStageId) {
        compoundKeyAliases.push(
            `${programId}.${programStageIdWithRepetition}.${dimensionId}`
        )
    }
    if (programStageId) {
        compoundKeyAliases.push(
            `${programStageIdWithRepetition}.${dimensionId}`
        )
    }
    if (programId) {
        compoundKeyAliases.push(`${programId}.${dimensionId}`)
    }

    return compoundKeyAliases
}
