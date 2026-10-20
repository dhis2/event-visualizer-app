import type { CurrentUser, PluginFilters, SavedVisualization } from '@types'

export type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualizationId: SavedVisualization['id']
    filters?: PluginFilters
}
