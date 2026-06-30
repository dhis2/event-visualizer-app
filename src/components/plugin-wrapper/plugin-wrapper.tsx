import { Center, CircularLoader } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { assertNever } from '@modules/utils/guards'
import { isVisualizationEmpty } from '@modules/visualization/state'
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
import { getBaseRequestIdentity as getLineListBaseRequestIdentity } from './hooks/query-tools-line-list'
import { getBaseRequestIdentity as getPivotTableBaseRequestIdentity } from './hooks/query-tools-pivot-table'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import classes from './styles/plugin-wrapper.module.css'

const getBaseRequestIdentity = (currentVis: CurrentVisualization) => {
    switch (currentVis.type) {
        case 'LINE_LIST':
            return getLineListBaseRequestIdentity(currentVis)
        case 'PIVOT_TABLE':
            return getPivotTableBaseRequestIdentity(currentVis)
        default:
            return assertNever(currentVis.type)
    }
}

/* The plugin's React key: it remounts (clearing the canvas, resetting sort and
 * page) when the base request identity changes. Sorting and paging aren't in
 * it, so they refetch in place instead of remounting. */
const getCurrentVisRequestKey = createSelector(
    (state: RootState) => state.currentVis,
    (currentVis) =>
        isVisualizationEmpty(currentVis)
            ? ''
            : JSON.stringify(getBaseRequestIdentity(currentVis))
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
    const requestKey = useAppSelector(getCurrentVisRequestKey)
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
        /* The plugin remounts when requestKey changes, so reset this wrapper's
         * local state too */
        setHasAnalyticsData(false)
    }, [requestKey])

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
                    key={requestKey}
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
                    key={requestKey}
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
