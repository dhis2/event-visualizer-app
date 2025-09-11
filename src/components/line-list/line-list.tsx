import { useDhis2ConnectionStatus } from '@dhis2/app-runtime'
import { DataTable } from '@dhis2/ui'
import cx from 'classnames'
import { createContext, useContext, type FC } from 'react'
import { FetchOverlay } from './fetch-overlay'
import { FixedDataTableHead } from './fixed-data-table-head'
import { LegendKey } from './legend-key'
import { NoTimeDimensionWarning } from './no-time-dimension-warning'
import classes from './styles/line-list.module.css'
import type { DataSortFn, LineListAnalyticsData, PaginateFn } from './types'
import { ScrollBox } from '@components/scroll-box/scroll-box'
import type { CurrentVisualization, SortDirection } from '@types'

type LineListProps = {
    analyticsData: LineListAnalyticsData
    onDataSort: DataSortFn
    onPaginate: PaginateFn
    page: number
    pageSize: number
    visualization: CurrentVisualization
    sortDirection?: SortDirection
    sortField?: string
    isFetching?: boolean
    isInDashboard?: boolean
    isInModal?: boolean
}

const LineListPropsContext = createContext<LineListProps | null>(null)
export const useLineListProps = (): LineListProps => {
    const props = useContext(LineListPropsContext)
    if (props === null) {
        throw new Error(
            'useLineListProps was used outside of the LineListPropsContext.Provider'
        )
    }
    return props
}

export const LineList: FC<LineListProps> = ({
    analyticsData,
    onDataSort,
    onPaginate,
    page,
    pageSize,
    sortDirection,
    sortField,
    visualization,
    isFetching = false,
    isInDashboard = false,
    isInModal = false,
}) => {
    const { isDisconnected } = useDhis2ConnectionStatus()
    console.log(
        'ALL PROPS',
        '\nanalyticsData: ',
        analyticsData,
        '\nonDataSort: ',
        onDataSort,
        '\nonPaginate: ',
        onPaginate,
        '\nvisualization: ',
        visualization,
        '\nisFetching: ',
        isFetching,
        '\nisInModal: ',
        isInModal,
        '\nisInDashboard: ',
        isInDashboard,
        page,
        pageSize,
        '\n======'
    )
    return (
        <div className={classes.grid}>
            <div
                className={classes.startColumnTop}
                data-test="start-column-top"
            >
                <NoTimeDimensionWarning
                    isInModal={isInModal}
                    visualization={visualization}
                />
            </div>
            <div
                className={classes.startColumnBottom}
                data-test="start-column-top"
            >
                <ScrollBox>
                    {isFetching && <FetchOverlay />}
                    <DataTable
                        width="auto"
                        className={cx(
                            classes.dataTable,
                            'push-analytics-linelist-table'
                        )}
                        dataTest="line-list-data-table"
                    >
                        <FixedDataTableHead
                            headers={analyticsData.headers}
                            isDisconnected={isDisconnected}
                            onDataSort={onDataSort}
                            sortField={sortField}
                            sortDirection={sortDirection}
                        />
                    </DataTable>
                </ScrollBox>
            </div>
            <div className={classes.endColumn} data-test="end-column">
                <LegendKey />
            </div>
        </div>
    )
}
