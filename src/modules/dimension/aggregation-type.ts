import type { AggregationType } from '@types'

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so a neutral numeric choice the user can
 * override stands in for it. The same stands in when the item's own type is
 * unknown, which happens for dimensions whose metadata came from an analytics
 * response rather than the sidebar. */
export const FALLBACK_AGGREGATION_TYPE: AggregationType = 'AVERAGE'

type AggregatableItem = { aggregationType?: AggregationType }

/* `DEFAULT` means "whatever this item aggregates by", and it is saved as is so
 * the visualization keeps following the item. It is resolved to a real type
 * only to show an aggregation name, and for the analytics request, which
 * rejects `DEFAULT` for an item that aggregates by NONE (E7265). */
export const resolveAggregationType = (
    aggregationType: AggregationType,
    item: AggregatableItem
): AggregationType => {
    if (aggregationType !== 'DEFAULT') {
        return aggregationType
    }

    return !item.aggregationType || item.aggregationType === 'NONE'
        ? FALLBACK_AGGREGATION_TYPE
        : item.aggregationType
}
