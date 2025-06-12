import type { Query, Mutation } from '@dhis2/app-service-data'
import type {
    BaseQueryFn,
    FetchBaseQueryError,
    BaseQueryApi,
} from '@reduxjs/toolkit/query'
import type {
    DataEngine,
    MutationResult,
    QueryResult,
} from '../types/data-engine'

// Either a query or a mutation object
type EngineArgs = Query | Mutation
type EngineResult = QueryResult | MutationResult

interface MetaWithEngine {
    engine: DataEngine
}

const isMutation = (args: EngineArgs): args is Mutation => {
    return typeof (args as Mutation).type === 'string'
}

type CustomError =
    | FetchBaseQueryError
    | { status: 'CUSTOM_ERROR'; data: string }

export const customBaseQuery: BaseQueryFn<
    EngineArgs, // args
    EngineResult, // result data
    CustomError, // error
    object, // base query options
    MetaWithEngine // meta from middleware
> = async (
    args: EngineArgs,
    api: BaseQueryApi, // This is the `api` arg, currently unused
    extraOptions
) => {
    console.log(
        'CBQ:\nargs: ',
        args,
        '\napi: ',
        api,
        '\nextraOptions: ',
        extraOptions
    )

    // Try to get engine from extraOptions.meta.baseQueryMeta.extra.engine
    // eslint-disable-next-line
    //@ts-ignore
    const engine = extraOptions?.meta?.baseQueryMeta?.extra?.engine
    console.log('engine', engine)

    if (!engine) {
        return {
            error: {
                status: 'CUSTOM_ERROR',
                data: 'DataEngine not available',
            },
        }
    }

    try {
        const result = isMutation(args)
            ? await engine.mutate(args)
            : await engine.query(args)

        return { data: result ?? {} }
    } catch (error: unknown) {
        return {
            error: {
                status: 'CUSTOM_ERROR',
                data: error instanceof Error ? error.message : 'Unknown error',
            },
        }
    }
}
