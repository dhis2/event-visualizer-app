import type {
    CachedDataQueryProvider,
    useCachedDataQuery,
} from './cached-data-query-provider'
import type { FileMenu } from './file-menu'
import type { HoverMenuBar } from './hover-menu-bar'
import type { HoverMenuDropdown } from './hover-menu-dropdown'
import type { HoverMenuList } from './hover-menu-list'
import type { HoverMenuListItem } from './hover-menu-list-item'
import type { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { UpdateButton } from './update-button'
import type { EventVisualizationType, VisualizationType } from '@types'

declare module '@dhis2/analytics' {
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const useCachedDataQuery: useCachedDataQuery
    export const FileMenu: FileMenu
    export const InterpretationsAndDetailsToggler: InterpretationsAndDetailsToggler
    export const HoverMenuBar: HoverMenuBar
    export const HoverMenuDropdown: HoverMenuDropdown
    export const HoverMenuListItem: HoverMenuListItem
    export const HoverMenuList: HoverMenuList
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const UpdateButton: UpdateButton
    export const visTypeDisplayNames: Array<
        Record<EventVisualizationType | VisualizationType, string>
    >
}

export type VisualizationTypeGroup = 'ALL' | 'CHARTS'
