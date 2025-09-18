import { useDhis2ConnectionStatus } from '@dhis2/app-runtime'
import {
    DataTable,
    DataTableBody,
    DataTableFoot,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui'
import cx from 'classnames'
import { useMemo, type FC } from 'react'
import { BodyCell } from './body-cell'
import { FetchOverlay } from './fetch-overlay'
import { HeaderCell } from './header-cell'
import { LegendKey } from './legend-key'
import { NoTimeDimensionWarning } from './no-time-dimension-warning'
import { ScrollBox } from './scroll-box'
import { StickyPagination } from './sticky-pagination'
import classes from './styles/line-list.module.css'
import type {
    ColumnHeaderClickFn,
    DataSortFn,
    LineListAnalyticsData,
    PaginateFn,
} from './types'
import { useTransformedLineListData } from './use-transformed-line-list-data'
import type { CurrentVisualization, SortDirection } from '@types'

type LineListProps = {
    analyticsData: LineListAnalyticsData
    onDataSort: DataSortFn
    onPaginate: PaginateFn
    visualization: CurrentVisualization
    isFetching?: boolean
    isInDashboard?: boolean
    isInModal?: boolean
    onColumnHeaderClick?: ColumnHeaderClickFn
    sortDirection?: SortDirection
    sortField?: string
}

export const LineList: FC<LineListProps> = ({
    analyticsData,
    onDataSort,
    onPaginate,
    visualization,
    isFetching = false,
    isInDashboard = false,
    isInModal = false,
    onColumnHeaderClick,
    sortDirection,
    sortField,
}) => {
    const { isDisconnected } = useDhis2ConnectionStatus()
    const { headers, rows, pager } = useTransformedLineListData(
        analyticsData,
        visualization
    )
    const sizeClass = useMemo(() => {
        switch (visualization.displayDensity) {
            case 'COMFORTABLE':
                return 'size-comfortable'
            case 'COMPACT':
                return 'size-compact'
            default:
                return 'size-normal'
        }
    }, [visualization.displayDensity])
    const fontSizeClass = useMemo(() => {
        switch (visualization.fontSize) {
            case 'LARGE':
                return 'font-size-large'
            case 'SMALL':
                return 'font-size-small'
            case 'NORMAL':
            default:
                return 'font-size-normal'
        }
    }, [visualization.fontSize])
    const colSpan = useMemo(
        () => String(Math.max(analyticsData.headers.length, 1)),
        [analyticsData.headers.length]
    )

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
        '\npager: ',
        pager,
        '\n======'
    )

    console.log('\nisInDashboard: ', isInDashboard)
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
                            fontSizeClass,
                            sizeClass,
                            'push-analytics-linelist-table'
                        )}
                        dataTest="line-list-data-table"
                    >
                        <DataTableHead
                            dataTest="line-list-data-table-head"
                            className={classes.fixedHead}
                        >
                            <DataTableRow dataTest="line-list-data-table-head-row">
                                {headers.map((header) => (
                                    <HeaderCell
                                        key={header.name}
                                        {...header}
                                        isDisconnected={isDisconnected}
                                        onDataSort={onDataSort}
                                        onColumnHeaderClick={
                                            onColumnHeaderClick
                                        }
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                    />
                                ))}
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody dataTest="line-list-data-table-body">
                            {rows.map((row, rowIndex) => (
                                <DataTableRow
                                    key={rowIndex}
                                    dataTest="table-row"
                                >
                                    {row.map((row, columnIndex) => (
                                        <BodyCell
                                            key={`${rowIndex}-${columnIndex}`}
                                            {...row}
                                        />
                                    ))}
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                        <DataTableFoot className={classes.fixedFoot}>
                            <DataTableRow>
                                <StickyPagination
                                    {...pager}
                                    isDisconnected={isDisconnected}
                                    isFetching={isFetching}
                                    colSpan={colSpan}
                                    onPaginate={onPaginate}
                                    pageLength={rows.length}
                                />
                            </DataTableRow>
                        </DataTableFoot>
                    </DataTable>
                </ScrollBox>
            </div>
            <div className={classes.endColumn} data-test="end-column">
                <LegendKey />
            </div>
        </div>
    )
}
