import { describe, it, expect } from 'vitest'
import {
    FALLBACK_AGGREGATION_TYPE,
    resolveAggregationType,
} from '../aggregation-type'

describe('resolveAggregationType', () => {
    it('keeps an explicit choice as it is', () => {
        expect(
            resolveAggregationType('SUM', { aggregationType: 'AVERAGE' })
        ).toBe('SUM')
    })

    it("resolves DEFAULT to the item's own aggregation type", () => {
        expect(
            resolveAggregationType('DEFAULT', { aggregationType: 'MAX' })
        ).toBe('MAX')
    })

    /* An item whose own type is NONE returns 0 for every cell, so it cannot be
     * the resolved choice. */
    it('resolves DEFAULT to the fallback when the item aggregates to NONE', () => {
        expect(
            resolveAggregationType('DEFAULT', { aggregationType: 'NONE' })
        ).toBe(FALLBACK_AGGREGATION_TYPE)
    })

    /* Dimensions whose metadata came from an analytics response rather than the
     * sidebar carry no aggregation type at all. */
    it('resolves DEFAULT to the fallback when the item has no aggregation type', () => {
        expect(resolveAggregationType('DEFAULT', {})).toBe(
            FALLBACK_AGGREGATION_TYPE
        )
    })

    it('keeps an explicit NONE, which only DEFAULT resolution rejects', () => {
        expect(resolveAggregationType('NONE', { aggregationType: 'SUM' })).toBe(
            'NONE'
        )
    })
})
