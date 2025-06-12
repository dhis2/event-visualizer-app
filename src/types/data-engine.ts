import type { ContextType } from '@dhis2/app-service-data'

export type DataEngine = ContextType['engine']
export type QueryResult = Awaited<ReturnType<DataEngine['query']>>
export type MutationResult = Awaited<ReturnType<DataEngine['mutate']>>
