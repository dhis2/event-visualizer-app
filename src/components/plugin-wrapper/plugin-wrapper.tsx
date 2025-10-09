import { Center, CircularLoader } from '@dhis2/ui'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { LineListPlugin } from './line-list-plugin'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import type { DataSortPayload } from '@components/line-list/types'
import { isVisualizationSaved } from '@modules/visualization'
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
    onResponseReceived: onResponseReceivedCb,
}) => {
    const [hasAnalyticsData, setHasAnalyticsData] = useState(false)

    console.log(
        'vis',
        visualization,
        'loading',
        isVisualizationLoading,
        'hasAnalyticsData',
        hasAnalyticsData
    )

    const onResponseReceived = useCallback(
        (args) => {
            console.log('pw response received', args)
            setHasAnalyticsData(true)

            onResponseReceivedCb?.(args)
        },
        [onResponseReceivedCb]
    )

    useEffect(() => setHasAnalyticsData(false), [visualization])

    console.log(
        'v loading',
        isVisualizationLoading,
        'analytics data',
        hasAnalyticsData
    )
    return (
        <>
            {isVisualizationLoading && !hasAnalyticsData && (
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
