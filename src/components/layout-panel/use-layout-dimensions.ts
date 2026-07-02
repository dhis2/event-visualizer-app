import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import {
    getDimensionSuffixes,
    type SuffixInput,
} from '@modules/dimension/suffix'
import type { DimensionMetadataItem } from '@types'
import { useMemo } from 'react'

interface UseLayoutDimensionsParams {
    dimensionIds: string[]
}

export const useLayoutDimensions = ({
    dimensionIds,
}: UseLayoutDimensionsParams): LayoutDimension[] => {
    const dimensionMetadataItems = useMetadataItems(dimensionIds)

    const programAndStageIds = useMemo(() => {
        const ids = new Set<string>()
        for (const id of dimensionIds) {
            const item = dimensionMetadataItems[id] as
                Partial<DimensionMetadataItem> | undefined
            if (item?.programId) {
                ids.add(item.programId)
            }
            if (item?.programStageId) {
                ids.add(item.programStageId)
            }
        }
        return Array.from(ids)
    }, [dimensionIds, dimensionMetadataItems])

    const programAndStageMetadataItems = useMetadataItems(programAndStageIds)

    return useMemo(() => {
        const dimensions: LayoutDimension[] = dimensionIds.map((id) => {
            const metadataItem = dimensionMetadataItems[id] as
                Partial<DimensionMetadataItem> | undefined
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

            return dimension
        })

        const suffixInputs: SuffixInput[] = dimensions.map((dim) => ({
            id: dim.id,
            dimensionType: dim.dimensionType ?? dim.dimensionItemType,
            programId: dim.programId,
            programStageId: dim.programStageId,
            trackedEntityTypeId: dim.trackedEntityTypeId,
        }))

        const suffixes = getDimensionSuffixes(
            suffixInputs,
            (id) =>
                dimensionMetadataItems[id]?.name ??
                programAndStageMetadataItems[id]?.name
        )

        return dimensions.map((dimension) => ({
            ...dimension,
            suffix: suffixes[dimension.id],
        }))
    }, [dimensionIds, dimensionMetadataItems, programAndStageMetadataItems])
}
