import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLineListAnalyticsData } from './hooks/use-line-list-analytics-data'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import { LineList } from '@components/line-list'
import type { LineListAnalyticsData } from '@components/line-list'
import type { DataSortFn, PaginateFn } from '@components/line-list/types'
import { transformVisualization } from '@modules/visualization'
import type { CurrentUser, CurrentVisualization, Sorting } from '@types'

type InternalSorting = Sorting | undefined

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    isInDashboard: boolean
    isInModal: boolean
    onDataSorted?: (sorting: InternalSorting) => void
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
                visualization: transformVisualization(eventVisualization),
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
            visualization: transformVisualization(eventVisualization),
            filters,
            displayProperty,
            onResponseReceived,
        })
    }, [
        displayProperty,
        filters,
        eventVisualization,
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
            visualization={eventVisualization}
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
