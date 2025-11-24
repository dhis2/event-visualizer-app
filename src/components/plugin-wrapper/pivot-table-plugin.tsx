import { type FC, useEffect, useMemo } from 'react'
import type { OnAnalyticsResponseReceivedCb } from './hooks/use-line-list-analytics-data'
import { usePivotTableAnalyticsData } from './hooks/use-pivot-table-analytics-data'
import { PivotTable } from '@dhis2/analytics'
import { transformVisualization } from '@modules/visualization'
import type { CurrentUser, CurrentVisualization, DimensionRecord } from '@types'

type PivotTablePluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown> // TODO: verify this type
    isInDashboard: boolean
    isInModal: boolean
    onResponseReceived: OnAnalyticsResponseReceivedCb
    //    id?: number
    style?: Record<string, string>
}

// TODO: this is to avoid height 0 on the PT component which hides the table
const STYLE_PROP_DEFAULT = { height: '100%' }

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    displayProperty,
    visualization,
    filters,
    onResponseReceived,
    style = STYLE_PROP_DEFAULT,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInDashboard,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInModal,
}) => {
    const [fetchAnalyticsData, { data }] = usePivotTableAnalyticsData()

    // XXX: temporary code until the analytics api is updated and returns all the correect metadata
    // at that point we can pass a fully transformed visualization to the PivotTable component
    const filterDimension = (dimensionObj: DimensionRecord) =>
        !['dy', 'latitude', 'longitude'].includes(dimensionObj.dimension)

    const visualizationForPTComponent: CurrentVisualization = useMemo(
        () =>
            ({
                ...visualization,
                columns: visualization.columns?.filter(filterDimension),
                rows: visualization.rows?.filter(filterDimension),
                filters: visualization.filters?.filter(filterDimension),
            } as CurrentVisualization),
        [visualization]
    )

    // TODO: implement onDataSorted and any other function/callback that cannot rely on the Redux store

    useEffect(() => {
        fetchAnalyticsData({
            visualization: transformVisualization(visualization),
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

    console.log('PT analytics data', data)

    return (
        <div style={style}>
            <PivotTable
                visualization={visualizationForPTComponent}
                data={data}
                //legendSets={legendSets}
                //renderCounter={id}
            />
        </div>
    )
}
