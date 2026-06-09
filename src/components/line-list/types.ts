import type { GridHeader, LegendSet, SortDirection } from '@types'

export type LineListHeader = {
    name: string
    displayText: string
    dimensionId: string
}
export type LineListCellData = {
    formattedValue: string
    value: string
    backgroundColor?: string
    isUndefined?: boolean
    isUrl?: boolean
    shouldNotWrap?: boolean
    textColor?: string
}
export type LineListRow = Array<LineListCellData>
export type LineListPager = {
    page: number
    pageSize: number
    isLastPage: boolean
}
export type LineListData = {
    headers: Array<LineListHeader>
    rows: Array<LineListRow>
    pager: LineListPager
    legendSets: LegendSet[]
}

export type CellData = string
type Row = Array<CellData>
export type LineListAnalyticsDataHeader = GridHeader & {
    legendSet: Pick<LegendSet, 'id' | 'name' | 'legends'>
    /* Canonical store ID for this column, computed in extractHeaders and
     * reused by downstream consumers so the wire-to-canonical translation
     * happens exactly once per response. */
    dimensionId: string
    /* Stage/program disambiguation suffix, combined with `column` at render. */
    dimensionSuffix?: string
}
export type LineListAnalyticsData = {
    headers: Array<LineListAnalyticsDataHeader>
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
export type DataSortFn = (payload: DataSortPayload) => void
export type PaginateFn = (payload: { page: number; pageSize?: number }) => void
export type ColumnHeaderClickFn = (cleanedHeaderName: string) => void
