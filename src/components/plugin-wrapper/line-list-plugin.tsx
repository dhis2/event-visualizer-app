import { LineList } from '@components/line-list'
import type { LineListAnalyticsData } from '@components/line-list'
import type {
    ColumnHeaderClickFn,
    DataSortFn,
    PaginateFn,
} from '@components/line-list/types'
import { transformVisualizationForAnalyticsRequest } from '@modules/analytics-request'
import { logger } from '@modules/logger'
import type { CurrentUser, CurrentVisualization, Sorting } from '@types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { useLineListAnalyticsData } from './hooks/use-line-list-analytics-data'

type InternalSorting = Sorting | undefined

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    relativePeriodDate?: string
    isInDashboard: boolean
    isInModal: boolean
    onColumnHeaderClick?: ColumnHeaderClickFn
    onDataSorted?: (sorting: InternalSorting) => void
    onResponseReceived: () => void
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    displayProperty,
    visualization,
    relativePeriodDate,
    isInDashboard,
    isInModal,
    onColumnHeaderClick,
    onDataSorted,
    onResponseReceived,
}) => {
    const [fetchAnalyticsData, { data, isFetching }] =
        useLineListAnalyticsData()

    // null indicates no custom sorting has been applied
    // undefined cannot be used because that is a valid value to indicate "remove sorting"
    const [sorting, setSorting] = useState<InternalSorting | null>(null)

    // Recompute eventVisualization whenever either visualization or the internal sorting change
    // App context: when sorting, the visualization change (currentVis changes in the store)
    // Interpretation modal context: when sorting, the internal sorting changes
    // Dashboard plugin context: when sorting, the internal sorting changes
    const eventVisualization = useMemo(() => {
        let newSorting = visualization.sorting

        if (sorting !== null) {
            newSorting = sorting ? [sorting as Sorting] : undefined
        }

        return {
            ...visualization,
            sorting: newSorting,
        } as CurrentVisualization
    }, [visualization, sorting])

    const onPaginate = useCallback<PaginateFn>(
        ({ page, pageSize }) => {
            fetchAnalyticsData({
                visualization:
                    transformVisualizationForAnalyticsRequest(
                        eventVisualization
                    ),
                relativePeriodDate,
                displayProperty,
                onResponseReceived,
                page,
                pageSize,
            })
        },
        [
            displayProperty,
            relativePeriodDate,
            eventVisualization,
            onResponseReceived,
            fetchAnalyticsData,
        ]
    )

    const onDataSort: DataSortFn = useCallback(
        (sortingFromTable) => {
            const newSorting = (
                sortingFromTable.direction === undefined
                    ? undefined
                    : sortingFromTable
            ) as InternalSorting

            // NOTE: this ultimately updates visualization which then triggers the useEffect below so we don't need to call fetchAnalyticsData directly here.
            // By doing so we cause a double fetch.
            if (onDataSorted) {
                onDataSorted(newSorting)
            } else {
                setSorting(newSorting)
            }
        },
        [onDataSorted]
    )

    useEffect(() => {
        fetchAnalyticsData({
            visualization:
                transformVisualizationForAnalyticsRequest(eventVisualization),
            relativePeriodDate,
            displayProperty,
            onResponseReceived,
        })
    }, [
        displayProperty,
        relativePeriodDate,
        eventVisualization,
        onResponseReceived,
        fetchAnalyticsData,
    ])

    logger.debug('LL eventVisualization', eventVisualization)
    logger.debug('LL analytics data', data)

    if (!data) {
        return null
    }

    return (
        <LineList
            analyticsData={data as LineListAnalyticsData}
            onDataSort={onDataSort}
            onPaginate={onPaginate}
            visualization={eventVisualization}
            isFetching={isFetching}
            isInDashboard={isInDashboard}
            isInModal={isInModal}
            onColumnHeaderClick={onColumnHeaderClick}
        />
    )
}
