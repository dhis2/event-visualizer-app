import type { AggregationType } from '@types'

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so a neutral numeric choice the user can
 * override stands in for it. The same stands in when the item's own type is
 * unknown, which happens for dimensions whose metadata came from an analytics
 * response rather than the sidebar. */
export const FALLBACK_AGGREGATION_TYPE: AggregationType = 'AVERAGE'

type AggregatableItem = { aggregationType?: AggregationType }

/* The concrete type to store for an item. `DEFAULT` is a UI-level choice
 * meaning "whatever this item aggregates by", so it is resolved here and never
 * persisted — which is what lets the layout show a real aggregation name
 * instead of the word "default". */
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
