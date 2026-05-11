import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import type { DimensionMetadataItem, OutputType, DimensionType } from '@types'
import { useMemo } from 'react'

interface UseLayoutDimensionsParams {
    dimensionIds: string[]
    outputType: OutputType
}

export const useLayoutDimensions = ({
    dimensionIds,
    outputType,
}: UseLayoutDimensionsParams): LayoutDimension[] => {
    const dimensionMetadataItems = useMetadataItems(dimensionIds)

    const programAndStageIds = useMemo(() => {
        const ids = new Set<string>()
        for (const id of dimensionIds) {
            const item = dimensionMetadataItems[id] as
                | Partial<DimensionMetadataItem>
                | undefined
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
                | Partial<DimensionMetadataItem>
                | undefined
            if (!metadataItem) {
                throw new Error(`missing metadata for dimension ${id}`)
            }

            const dimension: LayoutDimension = {
                id,
                name: metadataItem.name || id,
                dimensionId: metadataItem.dimensionId ?? id,
                programStageId: metadataItem.programStageId,
                programId: metadataItem.programId,
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

        if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(outputType)) {
            return dimensions
        }

        return dimensions.map((dimension) => {
            const dimensionTypeOrItemType =
                dimension.dimensionType || dimension.dimensionItemType
            if (
                dimensionTypeOrItemType &&
                ['DATA_ELEMENT', 'PERIOD'].includes(
                    dimensionTypeOrItemType as DimensionType
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
                            ? programAndStageMetadataItems[
                                  dimension.programStageId
                              ]?.name
                            : undefined
                    } else if (dimension.programId) {
                        dimension.suffix =
                            programAndStageMetadataItems[
                                dimension.programId
                            ]?.name
                    }
                }
            } else if (
                // always suffix ou and statuses for TE
                outputType === 'TRACKED_ENTITY_INSTANCE' &&
                dimensionTypeOrItemType &&
                ['ORGANISATION_UNIT', 'STATUS'].includes(
                    dimensionTypeOrItemType as DimensionType
                ) &&
                dimension.programId
            ) {
                dimension.suffix =
                    programAndStageMetadataItems[dimension.programId]?.name
            }

            return dimension
        })
    }, [
        dimensionIds,
        outputType,
        dimensionMetadataItems,
        programAndStageMetadataItems,
    ])
}
