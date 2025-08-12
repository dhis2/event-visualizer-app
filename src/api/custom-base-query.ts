import type { Query, Mutation } from '@dhis2/app-service-data'
import type { BaseQueryFn, BaseQueryApi } from '@reduxjs/toolkit/query'
import { EngineError, parseEngineError } from './parse-engine-error'
import type {
    AppCachedData,
    DataEngine,
    MetadataStore,
    MutationResult,
    QueryResult,
    SingleQuery,
} from '@types'

// cater for both queries and mutations
export type EngineArgs = Query | Mutation | SingleQuery
type EngineResult = QueryResult | MutationResult | unknown
type ThunkExtraArg = {
    engine: DataEngine
    metadataStore: MetadataStore
    cachedAppData: AppCachedData
}
// Inform TS that an instance of the DataEngine is available on api.extra.engine
export type BaseQueryApiWithExtraArg = BaseQueryApi & { extra: ThunkExtraArg }
export type CustomBaseQueryFn = BaseQueryFn<
    EngineArgs,
    EngineResult,
    EngineError,
    object, // base query options
    BaseQueryApiWithExtraArg
>

const isMutation = (args: EngineArgs): args is Mutation =>
    typeof (args as Mutation).type === 'string'

const isSingleQuery = (args: EngineArgs): args is SingleQuery =>
    !isMutation(args) && typeof (args as SingleQuery).resource === 'string'

export const customBaseQuery: CustomBaseQueryFn = async (
    args: EngineArgs,
    api: BaseQueryApiWithExtraArg
) => {
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
        console.error(error)
        return { error: parseEngineError(error) }
    }
}
