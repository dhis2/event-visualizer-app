import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import {
    getDimensionSuffix,
    type SuffixContext,
} from '@modules/dimension/suffix'
import type { DimensionMetadataItem } from '@types'

export const toLayoutDimension = (
    id: string,
    metadataItem: DimensionMetadataItem,
    suffixContext: SuffixContext
): LayoutDimension => {
    const dimension: LayoutDimension = {
        id,
        name: metadataItem.name || id,
        dimensionId: metadataItem.dimensionId ?? id,
        dimensionType: metadataItem.dimensionType,
        programStageId: metadataItem.programStageId,
        programId: metadataItem.programId,
        trackedEntityTypeId: metadataItem.trackedEntityTypeId,
        suffix: getDimensionSuffix(metadataItem, suffixContext),
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
}
