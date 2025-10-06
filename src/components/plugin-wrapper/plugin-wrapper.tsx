import type { FC } from 'react'
import { LineListPlugin } from './line-list-plugin'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import type { DataSortPayload } from '@components/line-list/types'
import type { CurrentUser, CurrentVisualization } from '@types'

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<'relativePeriodDate', string>
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    onDataSorted?: (sorting: DataSortPayload | undefined) => void
    onResponseReceived?: (metadata: MetadataInput) => void
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    onDataSorted,
    onResponseReceived,
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
                onDataSorted={onDataSorted}
                onResponseReceived={onResponseReceived}
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
