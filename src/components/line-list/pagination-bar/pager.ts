import type {
    LineListPager,
    PagerWithTotals,
} from '@components/line-list/types'

export const hasTotals = (pager: LineListPager): pager is PagerWithTotals =>
    'pageCount' in pager

export const isSinglePage = (pager: LineListPager): boolean =>
    hasTotals(pager)
        ? pager.pageCount <= 1
        : pager.page === 1 && pager.isLastPage

export const clampPage = (page: number, pageCount?: number): number =>
    Math.max(1, Math.min(page, pageCount ?? Number.POSITIVE_INFINITY))
