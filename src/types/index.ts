import type { ContextType } from '@dhis2/app-service-data'

/* The SingleQuery type is a simpler, but for our use-case functionally
 * equivalent, representation of the ResourceQuery internal to
 * @dhis2/app-service-data. The Query and Mutation types in that lib have
 * support for dynamic variables (functions), which we do not need because
 * RTK Query allows query object to be produced during runtime. The also
 * support some hypothetical variable types that currently are unsupported.
 * As such we could actually opt for manually creating a Query and Mutation
 * type here as well, which would produce more readable type hints */

type QueryParameters = {
    pageSize?: number
    [key: string]: number | string | boolean | Array<number | string | boolean>
}
export type SingleQuery = {
    resource: string
    id?: string
    data?: object | string
    params?: QueryParameters
}
export type DataEngine = ContextType['engine']
export type QueryResult = Awaited<ReturnType<DataEngine['query']>>
export type MutationResult = Awaited<ReturnType<DataEngine['mutate']>>
export type { AppStore, AppDispatch, RootState } from '../store.ts'
