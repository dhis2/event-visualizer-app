import { Query } from '@dhis2/app-service-data'
import { FC, ReactNode } from 'react'

type CachedDataQueryProviderProps = {
    children: ReactNode
    query: Query
    dataTransformation?: (data: unknown) => unknown
}

export type CachedDataQueryProvider = FC<CachedDataQueryProviderProps>
export type useCachedDataQuery<T> = () => T
