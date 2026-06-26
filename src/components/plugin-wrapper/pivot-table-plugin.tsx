import { PivotTable } from '@dhis2/analytics'
import { logger } from '@modules/logger'
import {
    getAnalyticsRequestHeaderName,
    transformVisualizationForAnalyticsRequest,
} from '@modules/visualization'
import type { CurrentUser, CurrentVisualization, DimensionArray } from '@types'
import { type FC, useEffect, useMemo } from 'react'
import { usePivotTableAnalyticsData } from './hooks/use-pivot-table-analytics-data'

const formatVisualizationForPivotTableEngine = (
    visualization: CurrentVisualization
): CurrentVisualization => {
    const formatDimensions = (dimensions: DimensionArray): DimensionArray =>
        dimensions.map((dim) => ({
            ...dim,
            dimension: getAnalyticsRequestHeaderName({
                dimensionId: dim.dimension,
                programId: dim.program?.id,
                programStageId: dim.programStage?.id,
                trackedEntityTypeId: visualization.trackedEntityType?.id,
                visualization,
            }),
        }))

    return {
        ...visualization,
        columns: formatDimensions(visualization.columns),
        rows: formatDimensions(visualization.rows),
        filters: formatDimensions(visualization.filters),
    }
}

type PivotTablePluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown> // TODO: verify this type
    isInDashboard: boolean
    isInModal: boolean
    onResponseReceived: () => void
}

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    displayProperty,
    visualization,
    filters,
    onResponseReceived,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInDashboard,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInModal,
}) => {
    // the dimension ids need to be formatted to match the ones returned in the analytics metaData, otherwise the PT engine fails to lookup the metadata
    const eventVisualization = useMemo(
        () =>
            formatVisualizationForPivotTableEngine(
                transformVisualizationForAnalyticsRequest(visualization)
            ),
        [visualization]
    )

    const [fetchAnalyticsData, { data }] = usePivotTableAnalyticsData()

    // TODO: implement onDataSorted and any other function/callback that cannot rely on the Redux store

    useEffect(() => {
        fetchAnalyticsData({
            visualization:
                transformVisualizationForAnalyticsRequest(visualization),
            filters,
            displayProperty,
            onResponseReceived,
        })
    }, [
        displayProperty,
        filters,
        visualization,
        onResponseReceived,
        fetchAnalyticsData,
    ])

    logger.debug('PT eventVisualization', eventVisualization)
    logger.debug('PT analytics data', data)

    if (!data) {
        return null
    }

    return <PivotTable visualization={eventVisualization} data={data} />
}
