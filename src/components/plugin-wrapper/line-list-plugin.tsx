//import { Center, CircularLoader } from '@dhis2/ui'
import type { FC } from 'react'
import { useCallback, useReducer, useState } from 'react'
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
import type { CurrentUser, CurrentVisualization, SortDirection } from '@types'

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    isInDashboard: boolean
    isInModal: boolean
    isVisualizationLoading: boolean
    onDataSorted?: (sorting: DataSortPayload | undefined) => void
    onResponseReceived?: (metadata: MetadataInput) => void
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    displayProperty,
    visualization: originalVisualization,
    filters,
    isInDashboard,
    isInModal,
    isVisualizationLoading,
    onDataSorted,
    onResponseReceived,
}) => {
    console.log(
        'LL plugin props',
        displayProperty,
        originalVisualization,
        filters,
        isInDashboard,
        isInModal,
        isVisualizationLoading
    )

    const [visualization, setVisualization] = useState<CurrentVisualization>(
        transformVisualization(originalVisualization)
    )

    const [{ pageSize, page }, setPagination] = useReducer(
        (pagination: { pageSize: number; page: number }, newPagination) => ({
            ...pagination,
            ...newPagination,
        }),
        {
            page: 1,
            pageSize: 100,
        }
    )

    const { dimension: sortField, direction: sortDirection } = visualization
        .sorting?.length
        ? visualization.sorting[0]
        : { dimension: undefined, direction: undefined }

    const onPaginate = useCallback<PaginateFn>(({ page, pageSize }) => {
        if (pageSize) {
            setPagination({ page, pageSize })
        } else {
            setPagination({ page })
        }
    }, [])

    const onDataSort: DataSortFn = useCallback(
        (sorting) => {
            const newSorting =
                sorting.direction === undefined ? undefined : sorting

            setVisualization({
                ...visualization,
                sorting: newSorting ? [newSorting] : undefined,
            } as CurrentVisualization)

            onDataSorted?.(newSorting)
        },
        [visualization, onDataSorted]
    )

    const {
        data,
        fetching: isFetching,
        //loading: isLoading,
        error,
        isGlobalLoading,
    } = useLineListAnalyticsData({
        visualization,
        filters,
        isVisualizationLoading,
        displayProperty,
        onResponseReceived,
        pageSize,
        page,
        sortField,
        sortDirection,
    })

    console.log('LL analytics data', data, isFetching, isGlobalLoading, error)
    console.log('LL in modal?', isInModal)

    if (!data || isGlobalLoading) {
        return null /*(
            <Center>
                <CircularLoader />
            </Center>
        )*/
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
            sortDirection={sortDirection as SortDirection}
            sortField={sortField}
        />
    )
}
