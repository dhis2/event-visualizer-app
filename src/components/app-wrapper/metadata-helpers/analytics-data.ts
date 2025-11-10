import { isMetadataItem, isUserOrgUnitMetadataInputItem } from './type-guards'
import type { AnalyticsMetadataInput } from './types'
import type { AnalyticsResponseMetadataDimensions } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'

export const extractMetadataFromAnalyticsResponse = (
    items: AnalyticsMetadataInput,
    dimensions: AnalyticsResponseMetadataDimensions
) =>
    Object.entries(items).reduce((acc, [key, value]) => {
        /* Do not add optionSets from analytics response data, because the options
         * array could be incomplete, and the items are lacking a name field.
         * A correct version of optionSet will be present in the metadata store already
         * because they are requested after the visualization response is received. */
        if (
            !isUserOrgUnitMetadataInputItem(value) &&
            isMetadataItem(value) &&
            'options' in value &&
            Array.isArray(value.options)
        ) {
            return acc
        }

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
