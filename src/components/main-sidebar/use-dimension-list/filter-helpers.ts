import { getFilterParamsFromBaseQuery } from './query-helpers'
import type {
    DataSourceFilter,
    DimensionMetadataItem,
    DimensionType,
    SingleQuery,
} from '@types'

const FILTER_PARAM_DIMENSION_TYPE = 'dimensionType:eq:'

export const isFetchEnabledByFilter = (
    baseQuery: SingleQuery,
    filter: DataSourceFilter | null
): boolean => {
    if (filter) {
        const dimensionTypeFilter = getFilterParamsFromBaseQuery(
            baseQuery
        ).find((str) => str.startsWith(FILTER_PARAM_DIMENSION_TYPE))

        if (dimensionTypeFilter) {
            const dimensionType = dimensionTypeFilter.replace(
                FILTER_PARAM_DIMENSION_TYPE,
                ''
            ) as DimensionType
            // Fetch only when query filter matches enabled filter
            return dimensionType === filter
        }
        // No dimension type filter in query, fetch regardless of filter
        return true
    }
    return true
}

export const filterDimensions = (
    dimensions: DimensionMetadataItem[],
    searchTerm: string,
    filter: DataSourceFilter | null
): DimensionMetadataItem[] => {
    const lowerSearchTerm = searchTerm.toLocaleLowerCase()

    return dimensions.filter((dimension) => {
        const searchTermMatch =
            !lowerSearchTerm ||
            dimension.name.toLocaleLowerCase().includes(lowerSearchTerm)
        const filterMatch = !filter || dimension.dimensionType === filter
        return searchTermMatch && filterMatch
    })
}

export const computeIsDisabledByFilter = (
    baseQuery: SingleQuery | undefined,
    filter: DataSourceFilter | null,
    fixedDimensionTypes: DimensionType[] = []
): boolean => {
    const hasMatchingFixedDimensionType =
        filter !== null &&
        Array.isArray(fixedDimensionTypes) &&
        fixedDimensionTypes.includes(filter)

    if (baseQuery) {
        // List with query: disabled if fetch not enabled AND no matching fixed dimension
        const isFetchEnabled = isFetchEnabledByFilter(baseQuery, filter)
        return !isFetchEnabled && !hasMatchingFixedDimensionType
    }
    // Fixed-only list: disabled only if filter doesn't match any fixed dimension
    return filter !== null && !hasMatchingFixedDimensionType
}
