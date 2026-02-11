import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import { isMetadataInputItem } from '@modules/metadata'
import { headersMap } from '@modules/visualization'
import type { AnalyticsResponseMetadataItems, MetadataInput } from '@types'

const extractItemsMetadata = (
    items: AnalyticsResponseMetadataItems
): MetadataInput =>
    Object.entries(items).reduce((acc, [key, value]) => {
        /* Do not add optionSets from analytics response data, because the options
         * array could be incomplete, and the items are lacking a name field.
         * A correct version of optionSet will be present in the metadata store already
         * because they are requested after the visualization response is received. */
        if (
            isMetadataInputItem(value) &&
            'options' in value &&
            Array.isArray(value.options)
        ) {
            return acc
        }

        /* Skip valueType from analytics response data as this is wrong in many cases.
         * In this way we keep the original valueType from the visualization's metadata which is correct
         * and avoid issues with the conditions modal which relies on valueType to render the correct content */
        acc[key] = {
            ...value,
            valueType: undefined,
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
                id: dimensionId,
                name: dimensionDisplayName,
            }
        }

        return acc
    }, metdataFromItems)

export const extractMetadataFromAnalyticsResponse = (
    items: AnalyticsResponseMetadataItems,
    headers: Array<LineListAnalyticsDataHeader>
): MetadataInput => {
    const metdataFromItems = extractItemsMetadata(items)
    return updateNamesFromHeaders(headers, metdataFromItems)
}
