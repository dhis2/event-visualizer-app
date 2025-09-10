import type { MetadataStoreItem } from '@components/app-wrapper/metadata-helpers/types'
import type { LayoutDimension } from '@components/visualization-layout/chip'
import type { SupportedDimensionType } from '@constants/dimension-types'
import type { SupportedInputType } from '@constants/input-types'

const extractDimensionIdParts = (id: string, inputType: SupportedInputType) => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || inputType !== 'TRACKED_ENTITY_INSTANCE') {
        rawStageId = part2
    }
    if (inputType === 'TRACKED_ENTITY_INSTANCE' && !part3) {
        programId = part2
    }
    const [programStageId, repetitionIndex] = (rawStageId || '').split('[')
    return {
        dimensionId,
        programStageId,
        ...(programId ? { programId } : {}),
        repetitionIndex:
            repetitionIndex?.length &&
            repetitionIndex.substring(0, repetitionIndex.indexOf(']')),
    }
}

interface GetLayoutDimensionsParams {
    dimensionIds: string[]
    inputType: SupportedInputType
    getMetadataItem: (id: string) => MetadataStoreItem | undefined
}

export const getLayoutDimensions = ({
    dimensionIds,
    inputType,
    getMetadataItem,
}: GetLayoutDimensionsParams): LayoutDimension[] => {
    const dimensions: LayoutDimension[] = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } =
            extractDimensionIdParts(id, inputType)

        const metadataItem = getMetadataItem(id)

        // Type guards to safely access properties
        const hasDimensionType = (
            item: MetadataStoreItem | undefined
        ): item is MetadataStoreItem & { dimensionType: unknown } =>
            item !== undefined && 'dimensionType' in item
        const hasOptionSet = (
            item: MetadataStoreItem | undefined
        ): item is MetadataStoreItem & { optionSet: unknown } =>
            item !== undefined && 'optionSet' in item
        const hasValueType = (
            item: MetadataStoreItem | undefined
        ): item is MetadataStoreItem & { valueType: unknown } =>
            item !== undefined && 'valueType' in item
        const hasDimensionItemType = (
            item: MetadataStoreItem | undefined
        ): item is MetadataStoreItem & { dimensionItemType: unknown } =>
            item !== undefined && 'dimensionItemType' in item

        // Build the dimension object step by step
        const dimension: LayoutDimension = {
            id: metadataItem?.id || id,
            name: metadataItem?.name || id,
            dimensionId,
            dimensionType: hasDimensionType(metadataItem)
                ? (metadataItem.dimensionType as SupportedDimensionType)
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

    if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(inputType)) {
        return dimensions
    }

    return dimensions.map((dimension) => {
        const dimensionTypeOrItemType =
            dimension.dimensionType || dimension.dimensionItemType
        if (
            dimensionTypeOrItemType &&
            ['DATA_ELEMENT', 'PERIOD'].includes(
                dimensionTypeOrItemType as SupportedDimensionType
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
                                dup.programStageId !== dpid.programStageId &&
                                dup.programId === dpid.programId
                        )
                    )

                if (sameProgramId || thirdPartyDuplicates) {
                    dimension.suffix = dimension.programStageId
                        ? getMetadataItem(dimension.programStageId)?.name
                        : undefined
                } else if (dimension.programId) {
                    dimension.suffix = getMetadataItem(
                        dimension.programId
                    )?.name
                }
            }
        } else if (
            // always suffix ou and statuses for TE
            inputType === 'TRACKED_ENTITY_INSTANCE' &&
            dimensionTypeOrItemType &&
            ['ORGANISATION_UNIT', 'STATUS'].includes(
                dimensionTypeOrItemType as SupportedDimensionType
            ) &&
            dimension.programId
        ) {
            dimension.suffix = getMetadataItem(dimension.programId)?.name
        }

        return dimension
    })
}
