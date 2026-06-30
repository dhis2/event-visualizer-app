import { parseCompoundDimensionId } from '@modules/dimension/ids'
import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
} from '@modules/metadata/item-guards'
import type { DimensionMetadataItem, MetadataMap } from '@types'

export type DimensionIdentifier = Pick<
    DimensionMetadataItem,
    | 'dimensionId'
    | 'programId'
    | 'programStageId'
    | 'trackedEntityTypeId'
    | 'repetitionIndex'
>

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
        // TrackedEntityType has no distinguishing fields (only `id` and `name`),
        // so no type guard is possible — assume the prefix is a tracked entity type ID.
        identifier.trackedEntityTypeId = unknownId
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
