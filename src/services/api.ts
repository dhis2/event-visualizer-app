import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from './custom-base-query'

export const api = createApi({
    reducerPath: 'api',
    baseQuery: customBaseQuery,
    endpoints: () => ({}), // Injected dynamically
})
