import type { AggregationType } from '@types'

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API rejects it unless the request names a type (E7265). Many tracked entity attributes (and
 * some data elements) carry NONE, so a neutral numeric choice the user can
 * override stands in for it. The same stands in when the item's own type is
 * unknown, which happens for dimensions whose metadata came from an analytics
 * response rather than the sidebar. */
export const FALLBACK_AGGREGATION_TYPE: AggregationType = 'AVERAGE'

type AggregatableItem = { aggregationType?: AggregationType }

/* `DEFAULT` means "whatever this item aggregates by", and it is saved and sent
 * to analytics as is, so the visualization keeps following the item. It is
 * resolved to a real type only to show an aggregation name. */
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

/* An item that aggregates by NONE has no default to follow, so `DEFAULT` is
 * replaced by the fallback. It is stored that way too: should the item get a
 * real aggregation type later, the visualization keeps showing the values the
 * user saw rather than quietly switching to that type. */
export const replaceDefaultForNoneItem = (
    aggregationType: AggregationType,
    item: AggregatableItem
): AggregationType =>
    aggregationType === 'DEFAULT' && item.aggregationType === 'NONE'
        ? FALLBACK_AGGREGATION_TYPE
        : aggregationType
