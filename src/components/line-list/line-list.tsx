import type { FC } from 'react'
import { FetchOverlay } from './fetch-overlay'
import { LegendKey } from './legend-key'
import { NoTimeDimensionWarning } from './no-time-dimension-warning'
import classes from './styles/line-list.module.css'
import type { LineListAnalyticsData } from './types'
import { ScrollBox } from '@components/scroll-box/scroll-box'
import type { CurrentVisualization } from '@types'

type LineListProps = {
    analyticsData: LineListAnalyticsData
    onDataSort: (direction: 'asc' | 'desc' | 'default') => void
    onPaginate: (page: number) => void
    visualization: CurrentVisualization
    isFetching?: boolean
    isInModal?: boolean
    isInDashboard?: boolean
}

export const LineList: FC<LineListProps> = ({
    analyticsData,
    onDataSort,
    onPaginate,
    visualization,
    isFetching = false,
    isInModal = false,
    isInDashboard = false,
}) => {
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
                    <div data-test="data-table">Table</div>
                </ScrollBox>
            </div>
            <div className={classes.endColumn} data-test="end-column">
                <LegendKey />
            </div>
        </div>
    )
}
