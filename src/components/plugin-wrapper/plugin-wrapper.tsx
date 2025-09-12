import type { FC } from 'react'
import { LineListPlugin } from './line-list-plugin'
import type { CurrentUser, CurrentVisualization } from '@types'

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown> // XXX verify this type
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    onResponsesReceived?: (responses: unknown[]) => void // TODO fix this type
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    onResponsesReceived,
    ...props
}) => {
    console.log('plugin wrapper received other props', props)

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
                {...props}
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
