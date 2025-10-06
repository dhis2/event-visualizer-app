import type { FC } from 'react'
//import { usePivotTableAnalyticsData } from './hooks/use-pivot-table-analytics-data'
//import { PivotTable } from '@dhis2/analytics'
//import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import type { CurrentUser, CurrentVisualization } from '@types'

type PivotTablePluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown> // TODO: verify this type
    isInDashboard: boolean
    isInModal: boolean
    isVisualizationLoading: boolean
    //    onResponseReceived?: (metadata: MetadataInput) => void
    //    id?: number
    style?: Record<string, string>
}

const STYLE_PROP_DEFAULT = {}

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard,
    isInModal,
    isVisualizationLoading,
    //    onResponseReceived,
    style = STYLE_PROP_DEFAULT,
}) => {
    console.log(
        'PT plugin props',
        displayProperty,
        visualization,
        filters,
        isInDashboard,
        isInModal,
        isVisualizationLoading,
        style
    )

    // TODO: implement onDataSorted and any other function/callback that cannot rely on the Redux store

    // TODO: fetch analytics for PT
    //    const { data } = usePivotTableAnalyticsData({
    //        visualization,
    //        filters,
    //        isVisualizationLoading,
    //        displayProperty,
    //        onResponseReceived,
    //    })

    //console.log('PT analytics data', data)

    return (
        <div style={style}>
            {/*
            <PivotTable
                visualization={visualization}
                data={data}
                legendSets={legendSets}
                //renderCounter={id}
            />
            */}
            <p>This is the PT plugin</p>
            <p>Showing {visualization.name}</p>
        </div>
    )
}
