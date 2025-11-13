import { isMetadataItem, isUserOrgUnitMetadataInputItem } from './type-guards'
import type { AnalyticsMetadataInput, MetadataInput } from './types'
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import type { AnalyticsResponseMetadataDimensions } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { headersMap } from '@modules/visualization'

const extractItemsMetadata = (
    items: AnalyticsMetadataInput,
    dimensions: AnalyticsResponseMetadataDimensions
): MetadataInput =>
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
        } else if (Object.keys(value).length === 1 && 'name' in value) {
            /* Some `metaData.items` only have a `name` field, like relative periods
             * to process these correctly we need to use the key as uid */
            acc[key] = {
                name: value.name,
                uid: key,
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

/* The headersMap is a lookup for app -> webApi (i.e. eventDate -> eventdate)
 * but here the lookup needs to be in the reverse order (i.e. eventdate -> eventDate)
 * because we need to map the keys from the header columns in the response data
 * for usage in the app */
const reversedHeadersMap = Object.entries(headersMap).reduce(
    (acc, [key, value]) => {
        acc[value] = key
        return acc
    },
    {}
)

const updateNamesFromHeaders = (
    headers: Array<LineListAnalyticsDataHeader>,
    metdataFromItems: MetadataInput
): MetadataInput =>
    headers.reduce((acc, header) => {
        if (!header.name || !header.column) {
            return acc
        }

        const dimensionId = reversedHeadersMap[header.name] ?? header.name
        const dimensionDisplayName = header.column

        if (acc[dimensionId]) {
            /* Exisiting items need their name updated, so that the metadata
             * name in the app matches the column name at all times */
            acc[dimensionId].name = dimensionDisplayName
        } else {
            /* Or new items can be created. Note that these are "new" only
             * in the context of analytics response data. The item may or
             * may not be available in the metadata store already, and the
             * smart merge in the metadata store will handle this correctly*/
            acc[dimensionId] = {
                uid: dimensionId,
                name: dimensionDisplayName,
            }
        }

        return acc
    }, metdataFromItems)

export const extractMetadataFromAnalyticsResponse = (
    items: AnalyticsMetadataInput,
    dimensions: AnalyticsResponseMetadataDimensions,
    headers: Array<LineListAnalyticsDataHeader>
): MetadataInput => {
    const metdataFromItems = extractItemsMetadata(items, dimensions)
    return updateNamesFromHeaders(headers, metdataFromItems)
}
