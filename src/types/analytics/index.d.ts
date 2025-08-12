import type {
    CachedDataQueryProvider,
    useCachedDataQuery,
} from './cached-data-query-provider'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { EventVisualizationType, VisualizationType } from '@types'

declare module '@dhis2/analytics' {
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const useCachedDataQuery: useCachedDataQuery
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const visTypeDisplayNames: Array<
        Record<EventVisualizationType | VisualizationType, string>
    >
}
