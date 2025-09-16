import type { FC } from 'react'
import { useCallback, useReducer, useState } from 'react'
import { useLineListAnalyticsData } from './hooks/use-line-list-analytics-data'
import { transformVisualization } from '@modules/visualization'
import type { CurrentUser, CurrentVisualization } from '@types'

type LineListPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    filters?: Record<string, unknown> // XXX verify this type
    isInDashboard: boolean
    isInModal: boolean
    isVisualizationLoading: boolean
    onResponsesReceived?: (responses: unknown[]) => void // TODO fix this type
}

const FIRST_PAGE: number = 1
const PAGE_SIZE: number = 100

export const LineListPlugin: FC<LineListPluginProps> = ({
    displayProperty,
    visualization: originalVisualization,
    filters,
    isInDashboard,
    isInModal,
    isVisualizationLoading,
    onResponsesReceived,
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

    // TODO add setter used in onDataSort
    const [visualization] = useState<CurrentVisualization>(
        transformVisualization(originalVisualization)
    )

    const [{ pageSize, page }, setPagination] = useReducer(
        (pagination: { pageSize: number; page: number }, newPagination) => ({
            ...pagination,
            ...newPagination,
        }),
        {
            page: FIRST_PAGE,
            pageSize: PAGE_SIZE,
        }
    )

    // TODO get this from visualization.sorting
    const sortField = null
    const sortDirection = 'default'

    // TODO remove this comment once LineList component is used here
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onPaginate = useCallback(
        ({ page, pageSize }) =>
            setPagination({ page: pageSize ? FIRST_PAGE : page, pageSize }),
        []
    )

    // TODO remove this comment once LineList component is used here
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onDataSort = useCallback(
        (sorting) => {
            console.log('onDataSort TBD', sorting)
            //setVisualization({
            //    ...originalVisualization,
            //    sorting,
            //})
        },
        [
            /*originalVisualization*/
        ]
    )

    const {
        data: analyticsData,
        fetching: isFetching,
        //loading,
        error,
        //isGlobalLoading,
    } = useLineListAnalyticsData({
        visualization,
        filters,
        isVisualizationLoading,
        displayProperty,
        onResponsesReceived,
        pageSize,
        page,
        sortField,
        sortDirection,
    })

    console.log('LL analytics data', analyticsData, isFetching, error)

    return (
        <div style={{ border: '1px solid green' }}>
            <p>This is the LL plugin</p>
            <p>Showing {visualization.name}</p>
        </div>
    )
}
