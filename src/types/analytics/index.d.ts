import type {
    CachedDataQueryProvider,
    useCachedDataQuery,
} from './cached-data-query-provider'

declare module '@dhis2/analytics' {
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const useCachedDataQuery: useCachedDataQuery
}
