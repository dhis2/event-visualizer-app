import { useMemo } from 'react'
import type { MetadataItem } from '@components/app-wrapper/metadata-helpers/types'
import { useMetadataItems } from '@components/app-wrapper/metadata-provider'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { getDimensionIdParts } from '@modules/dimension'
import type { DimensionType, OutputType } from '@types'

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

            // Type guards to safely access properties
            const hasDimensionType = (
                item: MetadataItem | undefined
            ): item is MetadataItem & { dimensionType: unknown } =>
                item !== undefined && 'dimensionType' in item

            const hasOptionSet = (
                item: MetadataItem | undefined
            ): item is MetadataItem & { optionSet: unknown } =>
                item !== undefined && 'optionSet' in item

            const hasValueType = (
                item: MetadataItem | undefined
            ): item is MetadataItem & { valueType: unknown } =>
                item !== undefined && 'valueType' in item

            const hasDimensionItemType = (
                item: MetadataItem | undefined
            ): item is MetadataItem & { dimensionItemType: unknown } =>
                item !== undefined && 'dimensionItemType' in item

            // Build the dimension object step by step
            const dimension: LayoutDimension = {
                id: metadataItem?.id || id,
                name: metadataItem?.name || id,
                dimensionId,
                dimensionType: hasDimensionType(metadataItem)
                    ? (metadataItem.dimensionType as DimensionType)
                    : undefined,
                programStageId,
                programId,
            }

            // Add optional properties if they exist
            if (hasOptionSet(metadataItem) && metadataItem.optionSet) {
                dimension.optionSet = metadataItem.optionSet as string
            }

            if (hasValueType(metadataItem) && metadataItem.valueType) {
                dimension.valueType =
                    metadataItem.valueType as LayoutDimension['valueType']
            }

            if (
                hasDimensionItemType(metadataItem) &&
                metadataItem.dimensionItemType
            ) {
                dimension.dimensionItemType =
                    metadataItem.dimensionItemType as LayoutDimension['dimensionItemType']
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
                            ? metadataItems[dimension.programStageId]?.name
                            : undefined
                    } else if (dimension.programId) {
                        dimension.suffix =
                            metadataItems[dimension.programId]?.name
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
                dimension.suffix = metadataItems[dimension.programId]?.name
            }

            return dimension
        })
    }, [dimensionIds, outputType, metadataItems])
}
