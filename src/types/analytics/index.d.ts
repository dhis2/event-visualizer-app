import type {
    CachedDataQueryProvider,
    useCachedDataQuery,
} from './cached-data-query-provider'
import type { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { UpdateButton } from './update-button'
import type { EventVisualizationType, VisualizationType } from '@types'

declare module '@dhis2/analytics' {
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const useCachedDataQuery: useCachedDataQuery
    export const InterpretationsAndDetailsToggler: InterpretationsAndDetailsToggler
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const UpdateButton: UpdateButton
    export const visTypeDisplayNames: Array<
        Record<EventVisualizationType | VisualizationType, string>
    >
}
