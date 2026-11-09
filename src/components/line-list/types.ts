import type { SortDirection } from '@types'

export type PagerWithoutTotals = {
    page: number
    pageSize: number
    isLastPage: boolean
}
export type PagerWithTotals = {
    page: number
    pageSize: number
    total: number
    pageCount: number
}
export type LineListPager = PagerWithoutTotals | PagerWithTotals
export type DataSortPayload = {
    dimension: string
    direction?: SortDirection
}
export type DataSortFn = (payload: DataSortPayload) => void
export type RequestedPage = { page: number; pageSize: number }

export type PaginateFn = (payload: RequestedPage) => void
export type ColumnHeaderClickFn = (cleanedHeaderName: string) => void
