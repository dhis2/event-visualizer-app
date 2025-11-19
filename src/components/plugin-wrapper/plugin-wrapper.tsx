import { Center, CircularLoader } from '@dhis2/ui'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { OnAnalyticsResponseReceivedCb } from './hooks/use-line-list-analytics-data'
import { LineListPlugin } from './line-list-plugin'
import { isVisualizationSaved } from '@modules/visualization'
import type { CurrentUser, CurrentVisualization, Sorting } from '@types'

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<'relativePeriodDate', string>
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    onDataSorted?: (sorting: Sorting | undefined) => void
    onResponsesReceived?: OnAnalyticsResponseReceivedCb
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    onDataSorted,
    onResponsesReceived: onResponsesReceivedCb,
}) => {
    const [hasAnalyticsData, setHasAnalyticsData] = useState(false)

    const onResponseReceived = useCallback<OnAnalyticsResponseReceivedCb>(
        (items, dimensions, headers) => {
            setHasAnalyticsData(true)

            onResponsesReceivedCb?.(items, dimensions, headers)
        },
        [onResponsesReceivedCb]
    )

    useEffect(() => {
        if (isVisualizationLoading === true) {
            // Reset hasAnalyticsData when a new visualization is fetched as we know it will need to re-fetch analytics.
            // This allows the spinner to show until the analytics response is available and the onResponseReceived above
            // changes hasAnalyticsData to true.
            setHasAnalyticsData(false)
        }
    }, [isVisualizationLoading])

    return (
        <>
            {(isVisualizationLoading || !hasAnalyticsData) && (
                <Center>
                    <CircularLoader />
                </Center>
            )}
            {visualization.type === 'LINE_LIST' && (
                <LineListPlugin
                    key={
                        isVisualizationSaved(visualization)
                            ? visualization.id
                            : 'new'
                    }
                    displayProperty={displayProperty}
                    visualization={visualization}
                    filters={filters}
                    isInDashboard={isInDashboard}
                    isInModal={isInModal}
                    onDataSorted={onDataSorted}
                    onResponseReceived={onResponseReceived}
                />
            )}
            {visualization.type === 'PIVOT_TABLE' && (
                <div>
                    <p>This is the PT plugin placeholder</p>
                    <p>Showing {visualization.name}</p>
                </div>
            )}
        </>
    )
}
