import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import { Center, CircularLoader } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization'
import { createSelector } from '@reduxjs/toolkit'
import type {
    CurrentUser,
    CurrentVisualization,
    EmptyVisualization,
    RootState,
    Sorting,
} from '@types'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type {
    AnalyticsResponseMetadataItems,
    OnAnalyticsResponseReceivedCb as OnLLAnalyticsResponseReceivedCb,
} from './hooks/use-line-list-analytics-data'
import type { OnAnalyticsResponseReceivedCb as OnPTAnalyticsResponseReceivedCb } from './hooks/use-pivot-table-analytics-data'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import classes from './styles/plugin-wrapper.module.css'

const getCurrentVisLayoutKey = createSelector(
    (state: RootState) => state.currentVis.outputType,
    (state: RootState) => state.currentVis.columns,
    (state: RootState) => state.currentVis.rows,
    (state: RootState) => state.currentVis.filters,
    (state: RootState) => state.currentVis.value?.id,
    (state: RootState) => state.currentVis.aggregationType,
    // eslint-disable-next-line max-params
    (outputType, columns, rows, filters, valueId, aggregationType) =>
        [
            outputType ?? '',
            valueId ?? '',
            aggregationType ?? '',
            ...[...(columns ?? []), ...(rows ?? []), ...(filters ?? [])].map(
                (d) => d.dimension
            ),
        ].join('|')
)

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization | EmptyVisualization
    filters?: Record<'relativePeriodDate', string> // TODO: check what dashboard passes here
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    onDataSorted?: (sorting: Sorting | undefined) => void
    onResponsesReceived?: (
        items: AnalyticsResponseMetadataItems,
        headers?: Array<LineListAnalyticsDataHeader>
    ) => void
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
    const layoutKey = useAppSelector(getCurrentVisLayoutKey)
    const [hasAnalyticsData, setHasAnalyticsData] = useState(false)

    const onLLResponseReceived = useCallback<OnLLAnalyticsResponseReceivedCb>(
        (items, headers) => {
            setHasAnalyticsData(true)

            onResponsesReceivedCb?.(items, headers)
        },
        [onResponsesReceivedCb]
    )

    const onPTResponseReceived = useCallback<OnPTAnalyticsResponseReceivedCb>(
        (items) => {
            setHasAnalyticsData(true)

            onResponsesReceivedCb?.(items)
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

    useEffect(() => {
        // layoutKey changes remount the plugin (it is its key), which discards
        // the table and re-fetches analytics. Reset hasAnalyticsData so the
        // spinner shows over the blank canvas until the new response arrives —
        // these layout switches never set isVisualizationLoading.
        setHasAnalyticsData(false)
    }, [layoutKey])

    if (isVisualizationEmpty(visualization)) {
        return null
    }

    return (
        <div className={classes.pluginWrapper}>
            {(isVisualizationLoading || !hasAnalyticsData) && (
                <Center>
                    <CircularLoader />
                </Center>
            )}
            {visualization.type === 'LINE_LIST' && (
                <LineListPlugin
                    key={layoutKey}
                    displayProperty={displayProperty}
                    visualization={visualization}
                    filters={filters}
                    isInDashboard={isInDashboard}
                    isInModal={isInModal}
                    onDataSorted={onDataSorted}
                    onResponseReceived={onLLResponseReceived}
                />
            )}
            {visualization.type === 'PIVOT_TABLE' && (
                <PivotTablePlugin
                    key={layoutKey}
                    displayProperty={displayProperty}
                    visualization={visualization}
                    filters={filters}
                    isInDashboard={isInDashboard}
                    isInModal={isInModal}
                    onResponseReceived={onPTResponseReceived}
                />
            )}
        </div>
    )
}
