import { resolveLayoutContext } from '@modules/layout'
import type { DimensionMetadataItem, MetadataItem, MetadataStore } from '@types'

export type SuffixContext = {
    programCount: number
    stageCount: number
    collidingStageIds: ReadonlySet<string>
    programNameById: ReadonlyMap<string, string>
    stageNameById: ReadonlyMap<string, string>
}

/* Pass the programs and program stages the layout holds. */
export const buildSuffixContext = ({
    programs,
    programStages,
}: {
    programs: readonly MetadataItem[]
    programStages: readonly MetadataItem[]
}): SuffixContext => {
    const programNameById = new Map<string, string>()
    const stageNameById = new Map<string, string>()
    const stageIdsByName = new Map<string, Set<string>>()
    const collidingStageIds = new Set<string>()

    for (const program of programs) {
        programNameById.set(program.id, program.name)
    }

    for (const stage of programStages) {
        stageNameById.set(stage.id, stage.name)
        const ids = stageIdsByName.get(stage.name) ?? new Set<string>()
        ids.add(stage.id)
        stageIdsByName.set(stage.name, ids)
    }

    for (const ids of stageIdsByName.values()) {
        if (ids.size > 1) {
            for (const id of ids) {
                collidingStageIds.add(id)
            }
        }
    }

    return {
        programCount: programs.length,
        stageCount: programStages.length,
        collidingStageIds,
        programNameById,
        stageNameById,
    }
}

const getStageSuffix = (
    stageId: string,
    programId: string | undefined,
    context: SuffixContext
): string | undefined => {
    if (context.stageCount <= 1) {
        return context.programCount > 1 && programId
            ? context.programNameById.get(programId)
            : undefined
    }

    const stageName = context.stageNameById.get(stageId)

    if (context.collidingStageIds.has(stageId) && programId) {
        const programName = context.programNameById.get(programId)
        return `${programName}, ${stageName}`
    }
    return stageName
}

export const getDimensionSuffix = (
    dimension: DimensionMetadataItem,
    context: SuffixContext
): string | undefined => {
    if (dimension.programStageId) {
        return getStageSuffix(
            dimension.programStageId,
            dimension.programId,
            context
        )
    }
    if (dimension.programId) {
        return context.programCount > 1
            ? context.programNameById.get(dimension.programId)
            : undefined
    }
    return undefined
}

/* Pure counterpart of the layout panel's suffix hook, for callers that read the
 * metadata store directly. Throws if a dimension has no metadata. */
export const getSuffixContext = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): SuffixContext => {
    const { programIds, programStageIds } = resolveLayoutContext(
        dimensionIds,
        metadataStore
    )
    return buildSuffixContext({
        programs: Object.values(metadataStore.getMetadataItems(programIds)),
        programStages: Object.values(
            metadataStore.getMetadataItems(programStageIds)
        ),
    })
}

export const getDimensionLabel = (name: string, suffix?: string): string =>
    suffix ? `${name} · ${suffix}` : name
