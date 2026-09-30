import type { SortDirection } from '@types'

export type LineListPager = {
    page: number
    pageSize: number
    isLastPage: boolean
}
export type DataSortPayload = {
    dimension: string
    direction?: SortDirection
}
export type DataSortFn = (payload: DataSortPayload) => void
export type PaginateFn = (payload: { page: number; pageSize?: number }) => void
export type ColumnHeaderClickFn = (cleanedHeaderName: string) => void
