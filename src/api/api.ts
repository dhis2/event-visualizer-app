import type { Query, Mutation } from '@dhis2/app-service-data'
import { createApi } from '@reduxjs/toolkit/query/react'
import { MutationResult, QueryResult, SingleQuery } from '../types'
import { customBaseQuery } from './custom-base-query'

export const api = createApi({
    reducerPath: 'api',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        query: builder.query<QueryResult, Query | SingleQuery>({
            query: (q) => q,
        }),
        mutate: builder.mutation<MutationResult, Mutation>({
            query: (m) => m,
        }),
    }),
})
/* Note that useRtkQuery accepts both a complex query object (as useDataQuery
 * from @dhis2/app-runtime) which can be used to query multiple resource at once,
 * as well as a simple query object which can be used to query one resource at a
 * time. The advantage of adding this is that you avoid having to work with nested
 * objects in the query definition or the data. */
export const {
    useQueryQuery: useRtkQuery,
    useLazyQueryQuery: useRtkLazyQuery,
    useMutateMutation: useRtkMutation,
} = api
