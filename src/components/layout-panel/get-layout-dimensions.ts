import type { MetadataStoreItem } from '@components/app-wrapper/metadata-helpers/types'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { getDimensionIdParts } from '@modules/dimension'
import type { DimensionType, InputType } from '@types'

interface GetLayoutDimensionsParams {
    dimensionIds: string[]
    inputType: InputType
    getMetadataItem: (id: string) => MetadataStoreItem | undefined
}

export const getLayoutDimensions = ({
    dimensionIds,
    inputType,
    getMetadataItem,
}: GetLayoutDimensionsParams): LayoutDimension[] => {
    const dimensions: LayoutDimension[] = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id,
            inputType,
        })

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

    if (!['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(inputType)) {
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
                dimensionTypeOrItemType as DimensionType
            ) &&
            dimension.programId
        ) {
            dimension.suffix = getMetadataItem(dimension.programId)?.name
        }

        return dimension
    })
}
