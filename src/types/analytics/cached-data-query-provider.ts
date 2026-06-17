import type { Query } from '@dhis2/app-service-data'
import type { FC, ReactNode } from 'react'

type CachedDataQueryProviderProps<TIn = unknown, TOut = unknown> = {
    children: ReactNode
    query: Query
    dataTransformation?: (data: TIn) => TOut
}

export type CachedDataQueryProvider = <TIn = unknown, TOut = unknown>(
    props: CachedDataQueryProviderProps<TIn, TOut>
) => ReturnType<FC>

export type useCachedDataQuery<T> = () => T
