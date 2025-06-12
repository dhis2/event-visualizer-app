import type { Query, Mutation } from '@dhis2/app-service-data'
import { createApi } from '@reduxjs/toolkit/query/react'
import { MutationResult, QueryResult } from '../types/data-engine'
import { customBaseQuery } from './custom-base-query'

export const api = createApi({
    reducerPath: 'api',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        query: builder.query<QueryResult, Query>({
            query: (q) => q,
        }),
        mutate: builder.mutation<MutationResult, Mutation>({
            query: (m) => m,
        }),
    }),
})

export const {
    useQueryQuery: useRtkqQuery,
    useLazyQueryQuery: useRtkqLazyQuery,
    useMutateMutation: useRtkqMutation,
} = api
