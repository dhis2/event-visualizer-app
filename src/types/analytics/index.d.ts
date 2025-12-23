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
import type { OuIdHelper } from './ou-id-helper'
import type { PeriodDimension } from './period-dimension'
import type { PivotTable } from './pivot-table'
import type { Toolbar } from './toolbar'
import type { ToolbarSidebar } from './toolbar-sidebar'
import type { UpdateButton } from './update-button'
import type { VisTypeIcon } from './vis-type-icon'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    DimensionRecord,
    EventVisualizationType,
    LegendSet,
    NewVisualization,
    SavedVisualization,
    ValueType,
    VisualizationType,
} from '@types'

declare module '@dhis2/analytics' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const Analytics: any

    // Components
    export const AboutAOUnit: AboutAOUnit
    export const CachedDataQueryProvider: CachedDataQueryProvider
    export const DashboardPluginWrapper: DashboardPluginWrapper
    export const FileMenu: FileMenu
    export const HoverMenuBar: HoverMenuBar
    export const HoverMenuDropdown: HoverMenuDropdown
    export const HoverMenuListItem: HoverMenuListItem
    export const HoverMenuList: HoverMenuList
    export const InterpretationModal: InterpretationModal
    export const LegendKey: FC<{ legendSets: LegendSet[] }>
    export const InterpretationsAndDetailsToggler: InterpretationsAndDetailsToggler
    export const InterpretationsProvider: InterpretationsProvider
    export const InterpretationsUnit: InterpretationsUnit
    export const PeriodDimension: PeriodDimension
    export const PivotTable: PivotTable
    export const Toolbar: Toolbar
    export const ToolbarSidebar: ToolbarSidebar
    export const UpdateButton: UpdateButton
    export const VisTypeIcon: VisTypeIcon

    // Hooks
    export const useCachedDataQuery: useCachedDataQuery

    // Primitives
    export const ouIdHelper: OuIdHelper

    export const visTypeDisplayNames: Array<
        Record<EventVisualizationType | VisualizationType, string>
    >

    export const AXIS: {
        defaultValue: undefined[]
        isValid: (axis: DimensionArray) => boolean
    }

    // Functions
    export const dimensionCreate: (
        dimensionId: string,
        itemIds: string[],
        args: Record<string, unknown>
    ) => DimensionRecord

    export const dimensionIsValid: (
        dimension: DimensionRecord,
        flags: { requireItems?: boolean }
    ) => boolean

    export const formatValue: (
        value: string,
        valueType: ValueType,
        visualization: Partial<SavedVisualization>
    ) => string

    export const getAvailableAxes: (visType: VisualizationType) => Axis[]

    export const getColorByValueFromLegendSet: (
        legendSet?: LegendSet,
        value?: string | number | boolean
    ) => string

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

    export const layoutGetDimension: (
        vis: CurrentVisualization,
        dimensionId: DimensionId
    ) => DimensionRecord | undefined

    export const layoutGetDimensionIdItemIdsObject: (
        vis: CurrentVisualization
    ) => {
        [dimensionId: string]: string[]
    }

    export const preparePayloadForSaveAs: ({
        visualization,
        name,
        description,
    }: {
        visualization: NewVisualization | SavedVisualization
        name?: string
        description?: string
    }) => NewVisualization | SavedVisualization

    export const preparePayloadForSave: ({
        visualization,
        name,
        description,
    }: {
        visualization: SavedVisualization
        name?: string
        description?: string
    }) => SavedVisualization

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const transformEventAggregateResponse: (any) => any
}
