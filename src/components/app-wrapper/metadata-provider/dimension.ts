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
    compoundId: string
): { ids: string[]; repetitionIndex?: number } => {
    if (!isPopulatedString(compoundId)) {
        throw new Error('Dimension ID input is not a populated string')
    }

    // Extract repetition index pattern `[<integer>]` from anywhere in the input string (applies to programStage)
    const repetitionMatch = REPETITION_INDEX_PATTERN.exec(compoundId)
    const processedInput = repetitionMatch
        ? compoundId.replace(REPETITION_INDEX_PATTERN, '')
        : compoundId
    const repetitionIndex = repetitionMatch
        ? Number(repetitionMatch[1])
        : undefined
    const ids = processedInput.split('.')

    if (!isPopulatedString(ids[ids.length - 1])) {
        throw new Error(`No valid dimension ID found in "${compoundId}"`)
    }

    if (ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected at most 3 IDs, got ${ids.length}`
        )
    }

    if (ids.some((id) => !isPopulatedString(id))) {
        throw new Error(
            `Invalid dimension ID format: empty ID found in "${compoundId}"`
        )
    }

    return { ids, repetitionIndex }
}

/**
 * Resolves a compound dimension ID to its canonical form:
 * - 3-segment (programId.stageId.dimId) → stageId.dimId
 * - 2-segment or plain ID → unchanged
 */
export const resolveId = (id: string): string => {
    const first = id.indexOf('.')
    if (first === -1) {
        return id // plain ID
    }
    const second = id.indexOf('.', first + 1)
    if (second === -1) {
        return id // 2-segment → already canonical
    }
    return id.slice(first + 1) // 3-segment → drop first part
}

type ResolveIdentifierFromContextMetadataArgs = {
    unknownId: string
    compoundId: string
    identifier: DimensionIdentifier
    metadataMap: MetadataMap
}

const resolveIdentifierFromContextMetadata = ({
    unknownId,
    compoundId,
    identifier,
    metadataMap,
}: ResolveIdentifierFromContextMetadataArgs): void => {
    const unknownMetadata = metadataMap.get(unknownId)

    if (!unknownMetadata) {
        throw new Error(
            `No context metadata found for dimension with compound ID "${compoundId}"`
        )
    }

    if (isProgramMetadataItem(unknownMetadata)) {
        identifier.programId = unknownId
    } else if (isProgramStageMetadataItem(unknownMetadata)) {
        identifier.programStageId = unknownId
        const resolvedProgramId =
            unknownMetadata.program?.id ?? identifier.programId
        if (resolvedProgramId) {
            identifier.programId = resolvedProgramId
        }
    } else {
        throw new Error(
            `Metadata item with ID "${unknownMetadata.id}" is not a program or program stage`
        )
    }
}

/**
 * Extracts dimension context (programId, programStageId, dimensionId,
 * repetitionIndex) from a compound ID. For 2-segment IDs, consults the
 * metadata map to determine whether the first segment is a program or stage.
 *
 * Used during metadata field enrichment only — not for ID canonicalization.
 */
export const extractDimensionContextFromCompoundId = (
    compoundId: string,
    metadataMap: MetadataMap
): DimensionIdentifier => {
    const { ids, repetitionIndex } = parseCompoundDimensionId(compoundId)
    const plainDimensionId = ids.pop()

    if (!plainDimensionId) {
        throw new Error(`No valid dimension ID found in "${compoundId}"`)
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
            compoundId,
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
