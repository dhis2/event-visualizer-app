import type { Query, Mutation } from '@dhis2/app-service-data'
import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from './custom-base-query'
import type { MutationResult, QueryResult, SingleQuery } from '@types'

export const api = createApi({
    reducerPath: 'api',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        query: builder.query<QueryResult | unknown, Query | SingleQuery>({
            query: (q) => q,
        }),
        mutate: builder.mutation<MutationResult, Mutation>({
            query: (m) => m,
        }),
    }),
})
