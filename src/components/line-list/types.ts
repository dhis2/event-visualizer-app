import type { GridHeader, SortDirection } from '@types'

type CellData = string | number | boolean
type Row = Array<CellData>
export type LineListAnalyticsData = {
    headers: Array<GridHeader>
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
