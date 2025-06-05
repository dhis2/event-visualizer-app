import type { ContextType } from '@dhis2/app-service-data'
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    BaseQueryApi,
} from '@reduxjs/toolkit/query'
import { createApi } from '@reduxjs/toolkit/query/react'

type DataEngine = ContextType['engine']

// Custom meta passed from middleware
interface CustomMeta {
    engine: DataEngine
}

// Replace empty object `{}` with `object` for query options
type QueryOptions = object

// Define a concrete error structure if possible, or use `unknown`
type CustomError =
    | FetchBaseQueryError
    | { status: 'CUSTOM_ERROR'; data: string }

const customBaseQuery: BaseQueryFn<
    QueryOptions | FetchArgs, // args
    unknown, // result data
    CustomError, // error
    QueryOptions, // base query options
    CustomMeta // meta from middleware
> = async (
    args: QueryOptions | FetchArgs,
    // This is the `api` arg, currently unused
    _: BaseQueryApi,
    extraOptions: { meta: CustomMeta }
) => {
    const { engine } = extraOptions.meta

    if (!engine) {
        return {
            error: {
                status: 'CUSTOM_ERROR',
                data: 'DataEngine not available',
            },
        }
    }

    try {
        // TODO: This needs to be addressed we need to pass the right args and call either
        // engine.query or engine.mutate
        // eslint-disable-next-line
        // @ts-ignore
        const result = await engine.query(args)
        return { data: result }
    } catch (error: unknown) {
        return {
            error: {
                status: 'CUSTOM_ERROR',
                data: error instanceof Error ? error.message : 'Unknown error',
            },
        }
    }
}

export const api = createApi({
    reducerPath: 'api',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getData: builder.query<unknown, QueryOptions>({
            query: (query) => query,
        }),
    }),
})
