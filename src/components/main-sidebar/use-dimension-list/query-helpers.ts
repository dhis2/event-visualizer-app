import { isObject, isPopulatedString } from '@modules/validation'
import type { SingleQuery } from '@types'

export type SingleQueryWithFilterParam = Omit<SingleQuery, 'params'> & {
    params: Omit<SingleQuery['params'], 'filter' | 'page'> & {
        filter: string[]
        page: number
    }
}

const FILTER_PARAM_SEARCH_TERM = 'displayName:ilike:'

export const getFilterParamsFromBaseQuery = (
    baseQuery: SingleQuery | undefined
): string[] => {
    if (!(isObject(baseQuery?.params) && 'filter' in baseQuery.params)) {
        return []
    }

    if (typeof baseQuery.params.filter === 'string') {
        return baseQuery.params.filter
            .split(',')
            .filter((str) => str.length > 0)
    } else if (
        Array.isArray(baseQuery.params.filter) &&
        baseQuery.params.filter.every((str) => isPopulatedString(str))
    ) {
        return [...baseQuery.params.filter]
    } else {
        throw new Error('Invalid filter query params')
    }
}

export const buildQuery = (
    baseQuery: SingleQuery,
    searchTerm: string,
    page: number
): SingleQueryWithFilterParam => {
    const query = { ...baseQuery }
    const params = {
        ...query.params,
        filter: getFilterParamsFromBaseQuery(query),
        page,
    }

    if (searchTerm) {
        params.filter.push(`${FILTER_PARAM_SEARCH_TERM}${searchTerm}`)
    }

    return {
        ...query,
        params,
    }
}
