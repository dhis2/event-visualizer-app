import type { AboutAOUnit } from './about-ao-unit'
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
import type { InterpretationModal } from './interpretation-modal'
import type { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import type { InterpretationsProvider } from './interpretations-provider'
import type { InterpretationsUnit } from './interpretations-unit'
import type { PivotTable } from './pivot-table'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { UpdateButton } from './update-button'
import type { VisTypeIcon } from './vis-type-icon'
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
    export const AboutAOUnit: AboutAOUnit
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
    export const InterpretationModal: InterpretationModal
    export const InterpretationsAndDetailsToggler: InterpretationsAndDetailsToggler
    export const InterpretationsProvider: InterpretationsProvider
    export const InterpretationsUnit: InterpretationsUnit
    export const PivotTable: PivotTable
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const UpdateButton: UpdateButton
    export const VisTypeIcon: VisTypeIcon
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
    export const LegendKey: FC<{ legendSets: LegendSet[] }>
}
