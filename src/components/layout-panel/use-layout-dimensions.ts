import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import { getChipSuffixes, type SuffixInput } from '@modules/chip-suffix'
import { getDimensionIdParts } from '@modules/dimension'
import type { OutputType } from '@types'
import { useMemo } from 'react'

interface UseLayoutDimensionsParams {
    dimensionIds: string[]
    outputType: OutputType
}

export const useLayoutDimensions = ({
    dimensionIds,
    outputType,
}: UseLayoutDimensionsParams): LayoutDimension[] => {
    // Collect all metadata IDs that will be needed
    const metadataIds = useMemo(() => {
        const ids = new Set<string>()

        // Add dimension IDs
        dimensionIds.forEach((id) => ids.add(id))

        // Add program and stage IDs for suffix calculation
        dimensionIds.forEach((id) => {
            const { programId, programStageId } = getDimensionIdParts({
                id,
                outputType,
            })
            if (programId) {
                ids.add(programId)
            }
            if (programStageId) {
                ids.add(programStageId)
            }
        })

        return Array.from(ids)
    }, [dimensionIds, outputType])

    // Get reactive metadata
    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(() => {
        const dimensions: LayoutDimension[] = dimensionIds.map((id) => {
            const { dimensionId, programStageId, programId } =
                getDimensionIdParts({
                    id,
                    outputType,
                })

            const metadataItem = metadataItems[id]
            const dimension: LayoutDimension = {
                id,
                name: metadataItem?.name || id,
                dimensionId,
                programStageId,
                programId,
            }

            // Build the dimension object with metadata
            if (metadataItem) {
                if (
                    'dimensionType' in metadataItem &&
                    metadataItem.dimensionType
                ) {
                    dimension.dimensionType = metadataItem.dimensionType
                }

                if ('optionSetId' in metadataItem && metadataItem.optionSetId) {
                    dimension.optionSet = metadataItem.optionSetId
                }

                if ('valueType' in metadataItem && metadataItem.valueType) {
                    dimension.valueType = metadataItem.valueType
                }

                if (
                    'dimensionItemType' in metadataItem &&
                    metadataItem.dimensionItemType
                ) {
                    dimension.dimensionItemType = metadataItem.dimensionItemType
                }
            } else {
                throw new Error(`missing metadata for dimension ${dimensionId}`)
            }

            return dimension
        })

        const suffixInputs: SuffixInput[] = dimensions.map((dim) => {
            const metadataItem = metadataItems[dim.id]
            return {
                id: dim.id,
                dimensionType: dim.dimensionType ?? dim.dimensionItemType,
                programId: dim.programId,
                programStageId: dim.programStageId,
                trackedEntityTypeId:
                    metadataItem &&
                    'trackedEntityTypeId' in metadataItem &&
                    metadataItem.trackedEntityTypeId
                        ? metadataItem.trackedEntityTypeId
                        : undefined,
            }
        })

        const suffixes = getChipSuffixes(
            suffixInputs,
            (id) => metadataItems[id]?.name
        )

        return dimensions.map((dimension) => ({
            ...dimension,
            suffix: suffixes[dimension.id],
        }))
    }, [dimensionIds, outputType, metadataItems])
}
