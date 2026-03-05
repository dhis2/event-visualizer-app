import { isObject, isPopulatedString } from '@modules/validation'
import type { CurrentUser, SingleQuery } from '@types'

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

type DimensionBaseQueryConfig = {
    resource: string
    dimensionType: string
    nameProp: CurrentUser['settings']['displayNameProperty']
    additionalParams?: Record<string, string | number | boolean>
}

/**
 * Create a base query for dimension lists with dynamic name property
 */
export const createDimensionBaseQuery = ({
    resource,
    dimensionType,
    nameProp,
    additionalParams,
}: DimensionBaseQueryConfig): SingleQuery => ({
    resource,
    params: {
        pageSize: 10,
        fields: `id,${nameProp}~rename(name),dimensionType,valueType,optionSet`,
        filter: `dimensionType:eq:${dimensionType}`,
        order: `${nameProp}:asc`,
        paging: true,
        ...additionalParams,
    },
})

/**
 * Create query for program indicators
 */
export const getProgramIndicatorQuery = (
    programId: string,
    nameProp: CurrentUser['settings']['displayNameProperty']
): SingleQuery =>
    createDimensionBaseQuery({
        resource: 'analytics/enrollments/query/dimensions',
        dimensionType: 'PROGRAM_INDICATOR',
        nameProp,
        additionalParams: { programId },
    })

/**
 * Create query for program attributes (tracked entity attributes)
 */
export const getProgramAttributeQuery = (
    programId: string,
    trackedEntityTypeId: string,
    nameProp: CurrentUser['settings']['displayNameProperty']
): SingleQuery =>
    createDimensionBaseQuery({
        resource: 'analytics/trackedEntities/query/dimensions',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        nameProp,
        additionalParams: {
            trackedEntityType: trackedEntityTypeId,
            program: programId,
        },
    })

/**
 * Create query for data elements without program stage ID (template)
 */
export const getDataElementQueryTemplate = (
    nameProp: CurrentUser['settings']['displayNameProperty']
): SingleQuery =>
    createDimensionBaseQuery({
        resource: 'analytics/events/query/dimensions',
        dimensionType: 'DATA_ELEMENT',
        nameProp,
    })

/**
 * Create query for data elements (event data)
 */
export const getDataElementQuery = (
    programStageId: string,
    nameProp: CurrentUser['settings']['displayNameProperty']
): SingleQuery => {
    const template = getDataElementQueryTemplate(nameProp)
    return {
        ...template,
        params: {
            ...template.params,
            programStageId,
        },
    }
}

/**
 * Create query for other dimensions (organisation unit group sets)
 */
export const getOtherDimensionsQuery = (
    nameProp: CurrentUser['settings']['displayNameProperty']
): SingleQuery =>
    createDimensionBaseQuery({
        resource: 'dimensions',
        dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
        nameProp,
    })
