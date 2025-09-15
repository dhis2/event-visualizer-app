import type { FC } from 'react'
import { LineListPlugin } from './line-list-plugin'
import type { CurrentUser, CurrentVisualization } from '@types'

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<'relativePeriodDate', string> // TODO check what dashboard passes here
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    onResponsesReceived?: (responses: unknown[]) => void // TODO use LineListAnalyticsData type
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    onResponsesReceived,
}) => {
    if (visualization.type === 'LINE_LIST') {
        return (
            <LineListPlugin
                displayProperty={displayProperty}
                visualization={visualization}
                filters={filters}
                isInDashboard={isInDashboard}
                isInModal={isInModal}
                isVisualizationLoading={isVisualizationLoading}
                onResponsesReceived={onResponsesReceived}
            />
        )
    } else if (visualization.type === 'PIVOT_TABLE') {
        return (
            <div>
                <p>This is the PT plugin placeholder</p>
                <p>Showing {visualization.name}</p>
            </div>
        )
    }
}
