import { isMetadataItem, isUserOrgUnitMetadataInputItem } from './type-guards'
import type { AnalyticsMetadataInput } from './types'
import type { AnalyticsResponseMetadataDimensions } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'

export const extractMetadataFromAnalyticsResponse = (
    items: AnalyticsMetadataInput,
    dimensions: AnalyticsResponseMetadataDimensions
) =>
    Object.entries(items).reduce((acc, [key, value]) => {
        // Ensure the "nested ID" is used consistently
        if (key.includes('.')) {
            acc[key] = {
                ...value,
                uid: key,
                id: key,
            }
        } else {
            acc[key] = value
        }

        /* Add legendSet metadata items so that legend items can be
         * related to dataElements */
        if (
            !isUserOrgUnitMetadataInputItem(value) &&
            isMetadataItem(value) &&
            typeof value.legendSet === 'string' &&
            value.legendSet.length > 0 &&
            Array.isArray(dimensions[key])
        ) {
            acc[value.legendSet] = {
                id: value.legendSet,
                legends: dimensions[key].map((legendItemKey) => {
                    const legendItem = items[legendItemKey]
                    if (!isMetadataItem(legendItem)) {
                        throw new Error(
                            'Legend item not found in analytics response data'
                        )
                    }
                    return {
                        id: legendItem.uid,
                        name: legendItem.name,
                    }
                }),
            }
        }

        return acc
    }, {})
