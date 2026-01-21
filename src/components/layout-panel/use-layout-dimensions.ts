import { useMemo } from 'react'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { useMetadataItems } from '@hooks'
import { getDimensionIdParts, isStatusDimension } from '@modules/dimension'
import type { OutputType } from '@types'

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

                if ('optionSet' in metadataItem && metadataItem.optionSet) {
                    dimension.optionSet = metadataItem.optionSet
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
            }

            return dimension
        })

        if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(outputType)) {
            return dimensions
        }

        return dimensions.map((dimension) => {
            const dimensionTypeOrItemType =
                dimension.dimensionType || dimension.dimensionItemType
            if (
                dimensionTypeOrItemType &&
                ['PROGRAM_DATA_ELEMENT', 'PERIOD'].includes(
                    dimensionTypeOrItemType
                )
            ) {
                const duplicates = dimensions.filter(
                    (d) =>
                        d.dimensionId === dimension.dimensionId &&
                        d !== dimension &&
                        ((dimension.programId && d.programId) ||
                            (dimension.programStageId && d.programStageId))
                )

                if (duplicates.length > 0) {
                    const sameProgramId = duplicates.find(
                        (dup) => dup.programId === dimension.programId
                    )
                    const thirdPartyDuplicates = duplicates
                        .filter((dup) => dup.programId !== dimension.programId)
                        .find((dpid) =>
                            duplicates.find(
                                (dup) =>
                                    dup.programStageId !==
                                        dpid.programStageId &&
                                    dup.programId === dpid.programId
                            )
                        )

                    if (sameProgramId || thirdPartyDuplicates) {
                        dimension.suffix = dimension.programStageId
                            ? metadataItems[dimension.programStageId]?.name
                            : undefined
                    } else if (dimension.programId) {
                        dimension.suffix =
                            metadataItems[dimension.programId]?.name
                    }
                }
            } else if (
                // always suffix ou and statuses for TE with programId
                outputType === 'TRACKED_ENTITY_INSTANCE' &&
                dimension.programId &&
                (dimensionTypeOrItemType === 'ORGANISATION_UNIT' ||
                    isStatusDimension(dimension.dimensionId))
            ) {
                dimension.suffix = metadataItems[dimension.programId]?.name
            }

            return dimension
        })
    }, [dimensionIds, outputType, metadataItems])
}
