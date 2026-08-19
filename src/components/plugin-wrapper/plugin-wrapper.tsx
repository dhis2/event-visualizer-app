import type { EngineError } from '@api/parse-engine-error'
import { CanvasError } from '@components/canvas-error/canvas-error'
import { CanvasErrorFallback } from '@components/canvas-error/canvas-error-fallback'
import { Center, CircularLoader } from '@dhis2/ui'
import { assertNever } from '@modules/utils/guards'
import { isVisualizationEmpty } from '@modules/visualization/state'
import type {
    CurrentUser,
    CurrentVisualization,
    EmptyVisualization,
    HostFilters,
    Sorting,
} from '@types'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FiltersNotAppliedNotice } from './filters-not-applied-notice'
import { getBaseRequestIdentity as getLineListBaseRequestIdentity } from './hooks/query-tools-line-list'
import { getBaseRequestIdentity as getPivotTableBaseRequestIdentity } from './hooks/query-tools-pivot-table'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import classes from './styles/plugin-wrapper.module.css'

const getBaseRequestIdentity = (
    currentVis: CurrentVisualization,
    filters?: HostFilters
) => {
    switch (currentVis.type) {
        case 'LINE_LIST':
            return getLineListBaseRequestIdentity(currentVis, filters)
        case 'PIVOT_TABLE':
            return getPivotTableBaseRequestIdentity(currentVis, filters)
        default:
            return assertNever(currentVis.type)
    }
}

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization | EmptyVisualization
    filters?: HostFilters
    isInDashboard?: boolean
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    isVisualizationLoading?: boolean
    visualizationLoadError?: EngineError
    onRetryLoad?: () => void
    onDataSorted?: (sorting: Sorting | undefined) => void
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard = false,
    isInModal = false,
    isVisualizationLoading = false,
    visualizationLoadError,
    onRetryLoad,
    onDataSorted,
}) => {
    /* Only relativePeriodDate ever reaches the analytics request; ou, pe and
     * yourDimensions are dashboard filters this app doesn't apply (see
     * FiltersNotAppliedNotice). Narrowing to it here, rather than passing the
     * raw filters prop through, keeps its reference stable across changes to
     * those other fields, so it doesn't needlessly retrigger the plugins'
     * fetch effects below. */
    const appliedFilters = useMemo<HostFilters | undefined>(
        () =>
            filters?.relativePeriodDate
                ? { relativePeriodDate: filters.relativePeriodDate }
                : undefined,
        [filters?.relativePeriodDate]
    )

    /* Remount key for the canvas: changing it clears errors and resets sort and
     * page. It's the base request identity (visualization + applied filters),
     * so a filter change remounts; sort/page aren't in it and refetch in place.
     * Prop-derived so it also works in the store-less dashboard plugin. */
    const requestKey = useMemo(
        () =>
            isVisualizationEmpty(visualization)
                ? ''
                : JSON.stringify(
                      getBaseRequestIdentity(visualization, appliedFilters)
                  ),
        [visualization, appliedFilters]
    )

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

    /* A fetch failure shows on the canvas with a Retry; a processing failure
     * ('runtime') is thrown so the shell error boundary shows a reload screen.
     * Checked before the empty guard, since a failed load leaves the
     * visualization empty. */
    if (visualizationLoadError) {
        if (visualizationLoadError.type === 'runtime') {
            throw new Error(visualizationLoadError.message)
        }
        return (
            <CanvasError error={visualizationLoadError} onRetry={onRetryLoad} />
        )
    }

    if (isVisualizationEmpty(visualization)) {
        return null
    }

    /* Wrapping the whole region means an analytics error replaces the spinner
     * instead of overlapping it. Retry resets hasAnalyticsData (already true
     * after a page/sort refetch) so the spinner shows during the retry. */
    return (
        <ErrorBoundary
            key={requestKey}
            FallbackComponent={CanvasErrorFallback}
            onReset={() => setHasAnalyticsData(false)}
        >
            <div className={classes.pluginWrapper}>
                {(isVisualizationLoading || !hasAnalyticsData) && (
                    <Center>
                        <CircularLoader />
                    </Center>
                )}
                <FiltersNotAppliedNotice
                    filters={filters}
                    isLoading={isVisualizationLoading || !hasAnalyticsData}
                />
                {visualization.type === 'LINE_LIST' && (
                    <LineListPlugin
                        displayProperty={displayProperty}
                        visualization={visualization}
                        filters={appliedFilters}
                        isInDashboard={isInDashboard}
                        isInModal={isInModal}
                        onDataSorted={onDataSorted}
                        onResponseReceived={onResponseReceived}
                    />
                )}
                {visualization.type === 'PIVOT_TABLE' && (
                    <PivotTablePlugin
                        displayProperty={displayProperty}
                        visualization={visualization}
                        filters={appliedFilters}
                        isInDashboard={isInDashboard}
                        isInModal={isInModal}
                        onResponseReceived={onResponseReceived}
                    />
                )}
            </div>
        </ErrorBoundary>
    )
}
