import { useMemo } from 'react'
import { FILTER_PARAM_DIMENSION_TYPE } from '@components/main-sidebar/use-dimension-list'
import { useAppSelector } from '@hooks'
import { isObject, isPopulatedString } from '@modules/validation'
import { getFilter } from '@store/dimensions-selection-slice'
import type { DimensionMetadataItem, DimensionType, SingleQuery } from '@types'

export type UseIsCardDisabledByFilterOptions = {
    initialDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
}
const getFilterParamArray = (query: SingleQuery | undefined): string[] => {
    if (!(isObject(query?.params) && 'filter' in query.params)) {
        return []
    }
    if (typeof query.params.filter === 'string') {
        return query.params.filter.split(',')
    } else if (
        Array.isArray(query.params.filter) &&
        query.params.filter.every(isPopulatedString)
    ) {
        return query.params.filter
    } else {
        throw new Error('Invalid query filter params')
    }
}

export const useIsCardDisabledByFilter = ({
    initialDimensions,
    baseQuery,
}: UseIsCardDisabledByFilterOptions): boolean => {
    const filter = useAppSelector(getFilter)
    return useMemo(() => {
        if (!filter) {
            return false
        }

        const queryFilterParamsDimension = getFilterParamArray(baseQuery)
            .find((filterStr) =>
                filterStr.startsWith(FILTER_PARAM_DIMENSION_TYPE)
            )
            ?.replace(FILTER_PARAM_DIMENSION_TYPE, '') as
            | DimensionType
            | undefined
        const isEnabledByQuery = queryFilterParamsDimension === filter
        const isEnabledByInitialDimensions =
            Array.isArray(initialDimensions) &&
            initialDimensions.some(
                (dimension) => dimension.dimensionType === filter
            )
        return !isEnabledByQuery && !isEnabledByInitialDimensions
    }, [initialDimensions, baseQuery, filter])
}
