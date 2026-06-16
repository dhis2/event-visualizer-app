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
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    onDataSorted,
}) => {
    const layoutKey = useAppSelector(getCurrentVisLayoutKey)
    const [hasAnalyticsData, setHasAnalyticsData] = useState(false)

    const onResponseReceived = useCallback(() => {
        setHasAnalyticsData(true)
    }, [])

    useEffect(() => {
        if (isVisualizationLoading === true) {
            // Reset hasAnalyticsData when a new visualization is fetched as we know it will need to re-fetch analytics.
            // This allows the spinner to show until the analytics response is available and onResponseReceived
            // changes hasAnalyticsData to true.
            setHasAnalyticsData(false)
        }
    }, [isVisualizationLoading])

    useEffect(() => {
        /* The visualization type specific plugin component remount when the layoutKey
         * changes so this means the local state in this wrapper also needs to reset */
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
                    onResponseReceived={onResponseReceived}
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
                    onResponseReceived={onResponseReceived}
                />
            )}
        </div>
    )
}
