import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import {
    useAppSelector,
    useDimensionMetadataItems,
    useMetadataItems,
} from '@hooks'
import {
    buildSuffixContext,
    getDimensionSuffix,
    type SuffixContext,
} from '@modules/dimension/suffix'
import {
    getVisUiConfigLayout,
    getVisUiConfigLayoutAllDimensionIds,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useMemo } from 'react'

export interface LayoutDimensionsByAxis {
    columns: LayoutDimension[]
    rows: LayoutDimension[]
    filters: LayoutDimension[]
}

/* Looks each id up in a by-id record, throwing if any is missing. The metadata
 * these ids point to is always present, so a miss means a real inconsistency
 * rather than a state to handle. */
const idsToItems = <T>(ids: string[], itemsById: Record<string, T>): T[] =>
    ids.map((id) => {
        const item = itemsById[id]
        if (!item) {
            throw new Error(`missing metadata for "${id}"`)
        }
        return item
    })

type SuffixContextResult = {
    context: SuffixContext
    dimensionMetadataItems: Record<string, DimensionMetadataItem>
}

/* Resolves the programs and stages the given dimensions reference and builds the
 * suffix context from them. Subscribes to the metadata so it recomputes when
 * names load. */
const useSuffixContext = (dimensionIds: string[]): SuffixContextResult => {
    const dimensionMetadataItems = useDimensionMetadataItems(dimensionIds)

    const { programIds, programStageIds } = useMemo(() => {
        const programs = new Set<string>()
        const stages = new Set<string>()
        for (const id of dimensionIds) {
            const item = dimensionMetadataItems[id]
            if (item?.programId) {
                programs.add(item.programId)
            }
            if (item?.programStageId) {
                stages.add(item.programStageId)
            }
        }
        return {
            programIds: Array.from(programs),
            programStageIds: Array.from(stages),
        }
    }, [dimensionIds, dimensionMetadataItems])

    const programAndStageIds = useMemo(
        () => [...programIds, ...programStageIds],
        [programIds, programStageIds]
    )
    const programAndStageMetadataItems = useMetadataItems(programAndStageIds)

    const context = useMemo(
        () =>
            buildSuffixContext({
                programs: idsToItems(programIds, programAndStageMetadataItems),
                programStages: idsToItems(
                    programStageIds,
                    programAndStageMetadataItems
                ),
            }),
        [programIds, programStageIds, programAndStageMetadataItems]
    )

    return { context, dimensionMetadataItems }
}

/* Turns dimension ids into LayoutDimensions, each with its suffix worked out
 * across the whole set passed in. */
export const useDimensionsWithSuffixes = (
    dimensionIds: string[]
): Record<string, LayoutDimension> => {
    const { context, dimensionMetadataItems } = useSuffixContext(dimensionIds)

    return useMemo(() => {
        return dimensionIds.reduce<Record<string, LayoutDimension>>(
            (acc, id) => {
                const metadataItem = dimensionMetadataItems[id]
                if (!metadataItem) {
                    throw new Error(`missing metadata for dimension ${id}`)
                }

                const dimension: LayoutDimension = {
                    id,
                    name: metadataItem.name || id,
                    dimensionId: metadataItem.dimensionId ?? id,
                    programStageId: metadataItem.programStageId,
                    programId: metadataItem.programId,
                    trackedEntityTypeId: metadataItem.trackedEntityTypeId,
                    suffix: getDimensionSuffix(metadataItem, context),
                }

                if (metadataItem.dimensionType) {
                    dimension.dimensionType = metadataItem.dimensionType
                }
                if (metadataItem.optionSetId) {
                    dimension.optionSet = metadataItem.optionSetId
                }
                if (metadataItem.valueType) {
                    dimension.valueType = metadataItem.valueType
                }
                if (metadataItem.dimensionItemType) {
                    dimension.dimensionItemType = metadataItem.dimensionItemType
                }

                acc[id] = dimension
                return acc
            },
            {}
        )
    }, [dimensionIds, dimensionMetadataItems, context])
}

/* The layout's dimensions, grouped per axis and ready to render as chips.
 * Suffixes are worked out across the whole layout, not per axis. */
export const useLayoutDimensions = (): LayoutDimensionsByAxis => {
    const allDimensionIds = useAppSelector(getVisUiConfigLayoutAllDimensionIds)
    const { columns, rows, filters } = useAppSelector(getVisUiConfigLayout)
    const dimensionsLookup = useDimensionsWithSuffixes(allDimensionIds)

    return useMemo(
        () => ({
            columns: idsToItems(columns, dimensionsLookup),
            rows: idsToItems(rows, dimensionsLookup),
            filters: idsToItems(filters, dimensionsLookup),
        }),
        [dimensionsLookup, columns, rows, filters]
    )
}

/* The suffix for a single dimension, worked out against the whole layout. The
 * dimension may not be in the layout yet (e.g. when opening its modal to add
 * it), so it is added to the comparison set when missing. */
export const useDimensionSuffix = (dimensionId: string): string | undefined => {
    const layoutDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const scopeIds = useMemo(
        () =>
            layoutDimensionIds.includes(dimensionId)
                ? layoutDimensionIds
                : [...layoutDimensionIds, dimensionId],
        [layoutDimensionIds, dimensionId]
    )
    const { context, dimensionMetadataItems } = useSuffixContext(scopeIds)

    return useMemo(() => {
        const item = dimensionMetadataItems[dimensionId]
        return getDimensionSuffix(item, context)
    }, [dimensionMetadataItems, dimensionId, context])
}
