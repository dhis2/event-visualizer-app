//import { Center, CircularLoader } from '@dhis2/ui'
import type { FC } from 'react'
import { useCallback, useEffect } from 'react'
import { useLineListAnalyticsData } from './hooks/use-line-list-analytics-data'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import { LineList } from '@components/line-list'
import type { LineListAnalyticsData } from '@components/line-list'
import type {
    DataSortFn,
    DataSortPayload,
    PaginateFn,
} from '@components/line-list/types'
import { transformVisualization } from '@modules/visualization'
import type { CurrentUser, CurrentVisualization } from '@types'

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    isInDashboard: boolean
    isInModal: boolean
    onDataSorted?: (sorting: DataSortPayload | undefined) => void
    onResponseReceived: (metadata: MetadataInput) => void
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    displayProperty,
    visualization,
    filters,
    isInDashboard,
    isInModal,
    onDataSorted,
    onResponseReceived,
}) => {
    const [fetchAnalyticsData, { data, isFetching }] =
        useLineListAnalyticsData()

    const onPaginate = useCallback<PaginateFn>(
        ({ page, pageSize }) => {
            fetchAnalyticsData({
                visualization: transformVisualization(visualization),
                filters,
                displayProperty,
                onResponseReceived,
                page,
                pageSize,
            })
        },
        [
            displayProperty,
            filters,
            visualization,
            onResponseReceived,
            fetchAnalyticsData,
        ]
    )

    const onDataSort: DataSortFn = useCallback(
        (sorting) => {
            const newSorting =
                sorting.direction === undefined ? undefined : sorting

            // NOTE: this ultimately updates visualization which then triggers the useEffect below so we don't need to call fetchAnalyticsData directly here.
            // By doing so we cause a double fetch.
            onDataSorted?.(newSorting)
        },
        [onDataSorted]
    )

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

    return (
        <LineList
            analyticsData={data as LineListAnalyticsData}
            onDataSort={onDataSort}
            onPaginate={onPaginate}
            visualization={visualization}
            isFetching={isFetching}
            isInDashboard={isInDashboard}
            isInModal={isInModal}
            onColumnHeaderClick={(dimensionId) => {
                console.log(
                    `Show options modal for dimension ID ${dimensionId}`
                )
            }}
        />
    )
}
