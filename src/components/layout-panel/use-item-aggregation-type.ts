import { aggregationTypeApi } from '@api/aggregation-type-api'
import { AGGREGATION_TYPES } from '@constants/aggregation-types'
import { useMetadataItem } from '@hooks'
import { isDimensionMetadataItem } from '@modules/metadata/item-guards'
import { skipToken } from '@reduxjs/toolkit/query'
import type { AggregationType } from '@types'

const isAggregationType = (value: unknown): value is AggregationType =>
    AGGREGATION_TYPES.includes(value as AggregationType)

/* The aggregation type the item itself is configured with, which analytics
 * applies when the value's aggregation type is DEFAULT. A saved visualization
 * already carries it on the value's metadata; a dimension from the sidebar or
 * the layout does not, so it is fetched. */
export const useItemAggregationType = (
    itemId: string | undefined
): { aggregationType?: AggregationType; isLoading: boolean } => {
    const item = useMetadataItem(itemId)
    const storedAggregationType =
        item &&
        'aggregationType' in item &&
        isAggregationType(item.aggregationType)
            ? item.aggregationType
            : undefined
    const shouldFetch = !storedAggregationType && isDimensionMetadataItem(item)

    const { data, isLoading } =
        aggregationTypeApi.useGetAggregationTypeByDimensionQuery(
            shouldFetch
                ? { dimensionId: item.id, dimensionType: item.dimensionType }
                : skipToken
        )

    return {
        aggregationType: storedAggregationType ?? data ?? undefined,
        isLoading,
    }
}
