import { PivotTable } from '@dhis2/analytics'
import { getFullDimensionId } from '@modules/dimension'
import {
    getHeadersMap,
    transformVisualizationForAnalyticsRequest,
} from '@modules/visualization'
import type { CurrentUser, CurrentVisualization, DimensionArray } from '@types'
import { type FC, useEffect, useMemo } from 'react'
import {
    usePivotTableAnalyticsData,
    type OnAnalyticsResponseReceivedCb,
} from './hooks/use-pivot-table-analytics-data'

const formatVisualizationForPivotTableEngine = (
    visualization: CurrentVisualization
): CurrentVisualization => {
    const headersMap = getHeadersMap(visualization)

    const formatDimensions = (dimensions: DimensionArray): DimensionArray =>
        dimensions.map((dimensionObj) => {
            /* for event/enrollment aggregate `ou` is always used as API dimension id
             * but returned as `ou` or `enrollmentou` in the analytics metaData */
            let dimensionId: string

            if (dimensionObj.dimension === 'ou') {
                dimensionId = dimensionObj.programStage?.id
                    ? dimensionObj.dimension
                    : 'enrollmentou'
            } else {
                dimensionId =
                    headersMap[dimensionObj.dimension] ?? dimensionObj.dimension
            }

            return {
                ...dimensionObj,
                dimension: getFullDimensionId({
                    dimensionId,
                    programStageId: dimensionObj.programStage?.id,
                    programId: dimensionObj.program?.id,
                    outputType: visualization.outputType,
                }),
            }
        })

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
    onResponseReceived: OnAnalyticsResponseReceivedCb
    //    id?: number
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
        () => formatVisualizationForPivotTableEngine(visualization),
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

    if (!data) {
        return null
    }

    return (
        <PivotTable
            visualization={eventVisualization}
            data={data}
            //legendSets={legendSets}
            //renderCounter={id}
        />
    )
}
