import type { GridHeader } from '@types'

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
