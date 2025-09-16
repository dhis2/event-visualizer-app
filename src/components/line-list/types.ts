import type { GridHeader, LegendSet, SortDirection } from '@types'

// TODO: check if this is correct
export type CellData = string | number | boolean
type Row = Array<CellData>
export type Header = GridHeader & {
    legendSet: Pick<LegendSet, 'id' | 'name' | 'legends'>
}
export type LineListAnalyticsData = {
    headers: Array<Header>
    rows: Array<Row>
    rowContext: {
        [key: string]: {
            [key: string]: {
                valueStatus: string
            }
        }
    }
    pager: {
        page: number
        pageSize: number
        isLastPage: boolean
    }
}
export type DataSortPayload = {
    dimension: string
    direction?: SortDirection
}
export type PaginatePayload = {
    page?: number
    pageSize?: number
}
export type DataSortFn = (payload?: DataSortPayload) => void
export type PaginateFn = (payload: PaginatePayload) => void
export type ColumnHeaderClickFn = (cleanedHeaderName: string) => void
