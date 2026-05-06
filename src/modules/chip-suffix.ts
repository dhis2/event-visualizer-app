import type { DimensionType } from '@types'

export type SuffixInput = {
    id: string
    dimensionType?: DimensionType
    programId?: string
    programStageId?: string
    trackedEntityTypeId?: string
}

export type GetName = (id: string) => string | undefined

const isTrackedEntityScoped = (dim: SuffixInput): boolean =>
    !!dim.trackedEntityTypeId || dim.dimensionType === 'PROGRAM_ATTRIBUTE'

export const getChipSuffixes = (
    dimensions: SuffixInput[],
    getName: GetName
): Record<string, string | undefined> => {
    const programIds = new Set<string>()
    const stageIds = new Set<string>()
    for (const dim of dimensions) {
        if (dim.programId) {
            programIds.add(dim.programId)
        }
        if (dim.programStageId) {
            stageIds.add(dim.programStageId)
        }
    }
    const programCount = programIds.size
    const stageCount = stageIds.size

    const stageIdsByStageName = new Map<string, Set<string>>()
    for (const dim of dimensions) {
        if (
            !dim.programStageId ||
            isTrackedEntityScoped(dim) ||
            stageCount <= 1
        ) {
            continue
        }
        const stageName = getName(dim.programStageId)
        if (!stageName) {
            continue
        }
        const ids =
            stageIdsByStageName.get(stageName) ??
            stageIdsByStageName
                .set(stageName, new Set<string>())
                .get(stageName)!
        ids.add(dim.programStageId)
    }

    const result: Record<string, string | undefined> = {}
    for (const dim of dimensions) {
        result[dim.id] = computeSuffix(dim, {
            programCount,
            stageCount,
            stageIdsByStageName,
            getName,
        })
    }
    return result
}

type SuffixContext = {
    programCount: number
    stageCount: number
    stageIdsByStageName: Map<string, Set<string>>
    getName: GetName
}

const computeSuffix = (
    dim: SuffixInput,
    ctx: SuffixContext
): string | undefined => {
    if (isTrackedEntityScoped(dim)) {
        return undefined
    }

    if (dim.programStageId) {
        if (ctx.stageCount > 1) {
            const stageName = ctx.getName(dim.programStageId)
            if (!stageName) {
                return undefined
            }
            const collidingStageIds = ctx.stageIdsByStageName.get(stageName)
            if (
                collidingStageIds &&
                collidingStageIds.size > 1 &&
                dim.programId
            ) {
                const programName = ctx.getName(dim.programId)
                if (programName) {
                    return `${programName}, ${stageName}`
                }
            }
            return stageName
        }
        if (ctx.programCount > 1 && dim.programId) {
            return ctx.getName(dim.programId)
        }
        return undefined
    }

    if (dim.programId) {
        return ctx.programCount > 1 ? ctx.getName(dim.programId) : undefined
    }

    return undefined
}
