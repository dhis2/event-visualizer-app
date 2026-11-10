import {
    clampPage,
    hasTotals,
    isSinglePage,
} from '@components/line-list/pagination-bar/pager'
import { describe, expect, it } from 'vitest'

describe('hasTotals', () => {
    it('is true for a pager with a page count', () => {
        expect(
            hasTotals({ page: 1, pageSize: 10, total: 16154, pageCount: 1616 })
        ).toBe(true)
    })

    it('is false for a pager with isLastPage', () => {
        expect(hasTotals({ page: 1, pageSize: 10, isLastPage: false })).toBe(
            false
        )
    })
})

describe('isSinglePage', () => {
    it('is true for the first page that is also the last', () => {
        expect(isSinglePage({ page: 1, pageSize: 100, isLastPage: true })).toBe(
            true
        )
    })

    it('is false for a later last page', () => {
        expect(isSinglePage({ page: 2, pageSize: 100, isLastPage: true })).toBe(
            false
        )
    })

    it('is true for a page count of 1', () => {
        expect(
            isSinglePage({ page: 1, pageSize: 100, total: 40, pageCount: 1 })
        ).toBe(true)
    })

    it('is true for a page count of 0', () => {
        expect(
            isSinglePage({ page: 1, pageSize: 100, total: 0, pageCount: 0 })
        ).toBe(true)
    })

    it('is false for a page count of 2', () => {
        expect(
            isSinglePage({ page: 1, pageSize: 100, total: 140, pageCount: 2 })
        ).toBe(false)
    })
})

describe('clampPage', () => {
    it('clamps to the page count', () => {
        expect(clampPage(75, 70)).toBe(70)
    })

    it('clamps to 1', () => {
        expect(clampPage(0, 70)).toBe(1)
        expect(clampPage(0)).toBe(1)
    })

    it('has no upper bound without a page count', () => {
        expect(clampPage(500)).toBe(500)
    })
})
