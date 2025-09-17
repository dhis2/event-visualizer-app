import type {
    CachedDataQueryProvider,
    useCachedDataQuery,
} from './cached-data-query-provider'
import type { DashboardPluginWrapper } from './dashboard-plugin-wrapper'
import type { FileMenu } from './file-menu'
import type { HoverMenuBar } from './hover-menu-bar'
import type { HoverMenuDropdown } from './hover-menu-dropdown'
import type { HoverMenuList } from './hover-menu-list'
import type { HoverMenuListItem } from './hover-menu-list-item'
import type { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import type { PivotTable } from './pivot-table'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { UpdateButton } from './update-button'
import type {
    CurrentVisualization,
    DimensionArray,
    EventVisualizationType,
    LegendSet,
    SavedVisualization,
    ValueType,
    VisualizationType,
} from '@types'

declare module '@dhis2/analytics' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const Analytics: any
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const useCachedDataQuery: useCachedDataQuery
    export const DashboardPluginWrapper: DashboardPluginWrapper
    export const FileMenu: FileMenu
    export const HoverMenuBar: HoverMenuBar
    export const HoverMenuDropdown: HoverMenuDropdown
    export const HoverMenuListItem: HoverMenuListItem
    export const HoverMenuList: HoverMenuList
    export const InterpretationsAndDetailsToggler: InterpretationsAndDetailsToggler
    export const PivotTable: PivotTable
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const UpdateButton: UpdateButton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const transformEventAggregateResponse: (any) => any
    export const visTypeDisplayNames: Array<
        Record<EventVisualizationType | VisualizationType, string>
    >
    export const layoutGetAllDimensions: (
        vis: CurrentVisualization
    ) => DimensionArray
    export const layoutGetAxisIdDimensionIdsObject: (
        vis: CurrentVisualization
    ) => {
        columns?: string[]
        rows?: string[]
        filters?: string[]
    }
    export const layoutGetDimensionIdItemIdsObject: (
        vis: CurrentVisualization
    ) => {
        [dimensionId: string]: string[]
    }
    export const getColorByValueFromLegendSet: (
        legendSet?: LegendSet,
        value?: string | number | boolean
    ) => string
    export const formatValue: (
        value: string,
        valueType: ValueType,
        visualization: Partial<SavedVisualization>
    ) => string
}
