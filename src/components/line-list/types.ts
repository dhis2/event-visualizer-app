import type { SortDirection } from '@types'

export type LineListPager = {
    page: number
    pageSize: number
    /* Sent only when totals are requested (totalPages=true), together with
     * total; isLastPage is sent only when they are not. */
    isLastPage?: boolean
    total?: number
    pageCount?: number
}
export type DataSortPayload = {
    dimension: string
    direction?: SortDirection
}
export type DataSortFn = (payload: DataSortPayload) => void
export type PaginateFn = (payload: { page: number; pageSize?: number }) => void
export type ColumnHeaderClickFn = (cleanedHeaderName: string) => void
