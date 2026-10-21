import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import type { Conditions, FormatValueOptions } from '@modules/conditions'
import {
    getDimensionValueMetadataIds,
    getDimensionValueTexts,
} from '@modules/dimension/value-texts'
import { useLocalizedStartEndDateFormatter } from '@modules/utils/dates'
import { useMemo } from 'react'

type UseDimensionValueTextsParams = {
    dimension: LayoutDimension
    itemIds: string[]
    conditions: Conditions
    formatValueOptions: FormatValueOptions
}

export const useDimensionValueTexts = ({
    dimension,
    itemIds,
    conditions,
    formatValueOptions,
}: UseDimensionValueTextsParams): string[] => {
    const formatStartEndDate = useLocalizedStartEndDateFormatter()
    const metadataIds = useMemo(
        () => getDimensionValueMetadataIds({ dimension, itemIds, conditions }),
        [dimension, itemIds, conditions]
    )
    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(
        () =>
            getDimensionValueTexts({
                dimension,
                itemIds,
                conditions,
                metadataItems,
                formatValueOptions,
                formatStartEndDate,
            }),
        [
            dimension,
            itemIds,
            conditions,
            metadataItems,
            formatValueOptions,
            formatStartEndDate,
        ]
    )
}
