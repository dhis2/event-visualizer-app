import { LineList } from '@components/line-list'
import type { LineListAnalyticsData } from '@components/line-list'
import type {
    ColumnHeaderClickFn,
    DataSortFn,
    PaginateFn,
} from '@components/line-list/types'
import { useAppDispatch } from '@hooks'
import { logger } from '@modules/logger'
import { transformVisualizationForAnalyticsRequest } from '@modules/visualization'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import type { CurrentUser, CurrentVisualization, Sorting } from '@types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { useLineListAnalyticsData } from './hooks/use-line-list-analytics-data'

type InternalSorting = Sorting | undefined

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    isInDashboard: boolean
    isInModal: boolean
    onDataSorted?: (sorting: InternalSorting) => void
    onResponseReceived: () => void
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
    const dispatch = useAppDispatch()

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

    const onColumnHeaderClick = useCallback<ColumnHeaderClickFn>(
        (dimensionId) => {
            logger.debug(`Show dimension modal for dimension ID ${dimensionId}`)

            dispatch(setUiActiveDimensionModal(dimensionId))
        },
        [dispatch]
    )

    const onPaginate = useCallback<PaginateFn>(
        ({ page, pageSize }) => {
            fetchAnalyticsData({
                visualization:
                    transformVisualizationForAnalyticsRequest(
                        eventVisualization
                    ),
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
            visualization:
                transformVisualizationForAnalyticsRequest(eventVisualization),
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
            onColumnHeaderClick={onColumnHeaderClick}
        />
    )
}
