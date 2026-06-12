import { useDhis2ConnectionStatus } from '@dhis2/app-runtime'
import type { CurrentVisualization } from '@types'
import cx from 'classnames'
import {
    useCallback,
    useMemo,
    useState,
    type FC,
    type PropsWithChildren,
} from 'react'
import { BodyCell } from './body-cell'
import { FetchOverlay } from './fetch-overlay'
import { HeaderCell } from './header-cell'
import { LegendKey } from './legend-key'
import { NoTimeDimensionWarning } from './no-time-dimension-warning'
import { PaginationBar } from './pagination-bar'
import { ScrollBox } from './scroll-box'
import classes from './styles/line-list.module.css'
import type {
    ColumnHeaderClickFn,
    DataSortFn,
    DataSortPayload,
    LineListAnalyticsData,
    PaginateFn,
} from './types'
import { useTransformedLineListData } from './use-transformed-line-list-data'

const ModalHeightConstrainer: FC<PropsWithChildren> = ({ children }) => {
    const [blockSize, setBlockSize] = useState<number | string>('100%')

    const onElementMount = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            setBlockSize(node.clientHeight)
        }
    }, [])

    return (
        <div
            ref={onElementMount}
            className={classes.modalHeightConstrainer}
            style={{ blockSize }}
        >
            {blockSize === '100%' ? null : children}
        </div>
    )
}

type LineListProps = {
    analyticsData: LineListAnalyticsData
    onDataSort: DataSortFn
    onPaginate: PaginateFn
    visualization: CurrentVisualization
    isFetching?: boolean
    isInDashboard?: boolean
    isInModal?: boolean
    onColumnHeaderClick?: ColumnHeaderClickFn
}

export const LineList: FC<LineListProps> = (props) =>
    props.isInModal ? (
        <ModalHeightConstrainer>
            <LineListInternal {...props} />
        </ModalHeightConstrainer>
    ) : (
        <LineListInternal {...props} />
    )

const LineListInternal: FC<LineListProps> = ({
    analyticsData,
    onDataSort,
    onPaginate,
    visualization,
    isFetching = false,
    isInDashboard = false,
    isInModal = false,
    onColumnHeaderClick,
}) => {
    const { isDisconnected } = useDhis2ConnectionStatus()
    const { headers, rows, pager, legendSets } = useTransformedLineListData(
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
    const sorting: DataSortPayload = useMemo(
        () =>
            visualization.sorting?.length
                ? visualization.sorting[0]
                : { dimension: '' },
        [visualization]
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
                data-test="start-column-bottom"
            >
                <ScrollBox>
                    {isFetching && <FetchOverlay />}
                    <table
                        className={cx(
                            classes.dataTable,
                            fontSizeClass,
                            sizeClass,
                            'push-analytics-linelist-table'
                        )}
                        data-test="line-list-data-table"
                    >
                        <thead
                            data-test="line-list-data-table-head"
                            className={classes.fixedHead}
                        >
                            <tr data-test="line-list-data-table-head-row">
                                {headers.map((header) => (
                                    <HeaderCell
                                        key={header.name}
                                        {...header}
                                        isDisconnected={isDisconnected}
                                        onDataSort={onDataSort}
                                        onColumnHeaderClick={
                                            onColumnHeaderClick
                                        }
                                        sortField={sorting.dimension}
                                        sortDirection={sorting?.direction}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody
                            data-test="line-list-data-table-body"
                            className={cx({
                                [classes.fetching]: isFetching,
                            })}
                        >
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex} data-test="table-row">
                                    {row.map((cell, columnIndex) => (
                                        <BodyCell
                                            key={`${rowIndex}-${columnIndex}`}
                                            {...cell}
                                        />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ScrollBox>
                <PaginationBar
                    {...pager}
                    isDisconnected={isDisconnected}
                    isFetching={isFetching}
                    onPaginate={onPaginate}
                    pageLength={rows.length}
                />
            </div>
            <div className={classes.endColumn} data-test="end-column">
                <LegendKey
                    isInDashboard={isInDashboard}
                    legendSets={legendSets}
                    showKey={visualization.legend?.showKey ?? false}
                />
            </div>
        </div>
    )
}
