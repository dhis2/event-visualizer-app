import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
} from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type { MetadataMap } from '@types'

type DimensionIdentifier = {
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
    compoundId: string
): { ids: string[]; repetitionIndex?: number } => {
    // Extract repetition index pattern `[<integer>]` from anywhere in the input string (applies to programStage)
    const repetitionMatch = compoundId.match(REPETITION_INDEX_PATTERN)
    const processedInput = repetitionMatch
        ? compoundId.replace(REPETITION_INDEX_PATTERN, '')
        : compoundId
    const repetitionIndex = repetitionMatch
        ? Number(repetitionMatch[1])
        : undefined
    const ids = processedInput.split('.')

    return { ids, repetitionIndex }
}

export const compoundIdToIdentifier = (
    compoundId: string,
    metadataMap: MetadataMap
): DimensionIdentifier => {
    const { ids, repetitionIndex } = parseCompoundDimensionId(compoundId)
    const plainDimensionId = ids.pop()

    if (!plainDimensionId) {
        throw new Error(`No valid dimension ID found in "${compoundId}"`)
    }

    if (ids.length < 1 || ids.length > 3) {
        throw new Error(
            `Invalid dimension ID format: expected 1-3 IDs, got ${ids.length}`
        )
    }

    if (ids.some((id) => !isPopulatedString(id))) {
        throw new Error(
            `Invalid dimension ID format: empty ID found in "${compoundId}"`
        )
    }

    const identifier: DimensionIdentifier = {
        id: plainDimensionId,
    }

    if (repetitionIndex) {
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
                identifier.programId = unknownMetadata.program.id
            } else {
                throw new Error(
                    `Metadata item with ID "${unknownMetadata.id}" is not a program or program stage`
                )
            }
        } else {
            throw new Error(
                `No context metadata found for dimension with compound ID "${compoundId}"`
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

export const computeCompoundIdAliasesFromDimensionIdentifier = (
    identifier: DimensionIdentifier
) => {
    const { id, programId, programStageId, repetitionIndex } = identifier
    const compoundIdAliases: string[] = []
    const programStageIdWithRepetition = repetitionIndex
        ? `${programStageId}[${repetitionIndex}]`
        : programStageId

    if (programId && programStageId) {
        compoundIdAliases.push(
            `${programId}.${programStageIdWithRepetition}.${id}`
        )
    }
    if (programStageId) {
        compoundIdAliases.push(`${programStageIdWithRepetition}.${id}`)
    }
    if (programId) {
        compoundIdAliases.push(`${programId}.${id}`)
    }

    return compoundIdAliases
}

export const isDimensionIdentifierMatch = (
    a: DimensionIdentifier,
    b: DimensionIdentifier
): boolean => {
    if (a.id !== b.id) {
        return false
    }

    if (
        a.programStageId &&
        b.programStageId &&
        a.programStageId === b.programStageId &&
        // Also true if both do not have a repetitionIndex
        a.repetitionIndex === b.repetitionIndex
    ) {
        return true
    }

    if (
        !a.programStageId &&
        !b.programStageId &&
        a.programId &&
        b.programId &&
        a.programId === b.programId
    ) {
        return true
    }

    return false
}

export class CompoundDimensionIdAliasLookup {
    private metadataMap: MetadataMap
    private aliasToTarget = new Map<string, string>()
    private targetToAliases = new Map<string, Set<string>>()
    private pendingAliases = new Set<string>()

    constructor(metadataMap: MetadataMap) {
        this.metadataMap = metadataMap
    }

    registerAlias(aliasId: string) {
        if (this.metadataMap.has(aliasId)) {
            console.error(`Item with ID ${aliasId} exist, no alias needed.`)
            return
        }
        const identifier = compoundIdToIdentifier(aliasId, this.metadataMap)
        const potentialTargetIds =
            computeCompoundIdAliasesFromDimensionIdentifier(identifier)
        const targetId = potentialTargetIds.find((potentialTargetId) =>
            this.metadataMap.has(potentialTargetId)
        )

        if (targetId) {
            this.bindAlias(aliasId, targetId)
        } else {
            this.pendingAliases.add(aliasId)
        }
    }

    resolvePendingAliases(targetId: string) {
        const targetIdentifier = compoundIdToIdentifier(
            targetId,
            this.metadataMap
        )

        for (const aliasId of this.pendingAliases) {
            if (this.metadataMap.has(aliasId)) {
                console.error(
                    `Item with ID ${aliasId} exist, no alias needed (removing).`
                )
                this.pendingAliases.delete(aliasId)
                continue
            }

            const aliasIdentifier = compoundIdToIdentifier(
                aliasId,
                this.metadataMap
            )

            if (isDimensionIdentifierMatch(targetIdentifier, aliasIdentifier)) {
                this.bindAlias(aliasId, targetId)
                this.pendingAliases.delete(aliasId)
            }
        }
    }

    getAliases(targetId: string): ReadonlySet<string> | undefined {
        return this.targetToAliases.get(targetId)
    }

    getTargetForAlias(aliasId: string): string | undefined {
        return this.aliasToTarget.get(aliasId)
    }

    removeAlias(aliasId: string): void {
        if (this.pendingAliases.has(aliasId)) {
            this.pendingAliases.delete(aliasId)
        } else {
            const targetKey = this.aliasToTarget.get(aliasId)
            if (!targetKey) {
                return
            }

            this.aliasToTarget.delete(aliasId)
            this.removeReverseAlias(targetKey, aliasId)
        }
    }

    clear(): void {
        this.aliasToTarget.clear()
        this.targetToAliases.clear()
        this.pendingAliases.clear()
    }

    private bindAlias(aliasId: string, targetId: string): void {
        this.aliasToTarget.set(aliasId, targetId)

        if (!this.targetToAliases.has(targetId)) {
            this.targetToAliases.set(targetId, new Set())
        }

        this.targetToAliases.get(targetId)!.add(aliasId)
    }

    private removeReverseAlias(targetId: string, aliasId: string): void {
        const aliases = this.targetToAliases.get(targetId)
        if (!aliases) {
            return
        }

        aliases.delete(aliasId)
        if (aliases.size === 0) {
            this.targetToAliases.delete(targetId)
        }
    }
}
