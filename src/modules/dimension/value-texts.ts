import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import {
    getConditionsMetadataIds,
    getConditionsTexts,
    type Conditions,
    type FormatValueOptions,
} from '@modules/conditions'
import { isItemBasedDimensionType } from '@modules/dimension/dimension-type'
import {
    getItemDisplayNames,
    getItemMetadataIds,
} from '@modules/dimension/item-names'
import type { MetadataItem } from '@types'

type DimensionValues = {
    dimension: LayoutDimension
    itemIds: string[]
    conditions: Conditions
}

export const getDimensionValueMetadataIds = ({
    dimension,
    itemIds,
    conditions,
}: DimensionValues): string[] =>
    isItemBasedDimensionType(dimension.dimensionType)
        ? getItemMetadataIds(itemIds)
        : getConditionsMetadataIds({ conditions, dimension })

export const getDimensionValueTexts = ({
    dimension,
    itemIds,
    conditions,
    metadataItems,
    formatValueOptions,
    formatStartEndDate,
}: DimensionValues & {
    metadataItems: Record<string, MetadataItem | undefined>
    formatValueOptions: FormatValueOptions
    formatStartEndDate: (startEndDate: string) => string
}): string[] =>
    isItemBasedDimensionType(dimension.dimensionType)
        ? getItemDisplayNames({ itemIds, metadataItems, formatStartEndDate })
        : getConditionsTexts({
              conditions,
              dimension,
              formatValueOptions,
              metadataItems,
          })
