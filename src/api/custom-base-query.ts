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
    SingleQuery,
} from '../types'

// cater for both queries and mutations
type EngineArgs = Query | Mutation | SingleQuery
type EngineResult = QueryResult | MutationResult
type ThunkExtraArg = {
    engine: DataEngine
}
// Inform TS that an instance of the DataEngine is available on api.extra.engine
export type BaseQueryApiWithExtraArg = BaseQueryApi & { extra: ThunkExtraArg }
type CustomError =
    | FetchBaseQueryError
    | { status: 'CUSTOM_ERROR'; data: string }

const isMutation = (args: EngineArgs): args is Mutation =>
    typeof (args as Mutation).type === 'string'

const isSingleQuery = (args: EngineArgs): args is SingleQuery =>
    !isMutation(args) && typeof (args as SingleQuery).resource === 'string'

export const customBaseQuery: BaseQueryFn<
    EngineArgs,
    EngineResult,
    CustomError,
    object, // base query options
    BaseQueryApiWithExtraArg
> = async (args: EngineArgs, api: BaseQueryApiWithExtraArg) => {
    const { engine } = api.extra

    try {
        if (isMutation(args)) {
            const mutationResult = await engine.mutate(args)
            return { data: mutationResult ?? {} }
        } else if (isSingleQuery(args)) {
            const singleQueryResult = await engine.query({ data: args })
            return { data: singleQueryResult.data ?? {} }
        } else {
            const queryResult = await engine.query(args)
            return { data: queryResult ?? {} }
        }
    } catch (error: unknown) {
        return {
            error: {
                status: 'CUSTOM_ERROR',
                data: error instanceof Error ? error.message : 'Unknown error',
            },
        }
    }
}
