import {
    isActiveFilterDimension,
    isActiveFilterDimensionRecord,
} from '@modules/dimension/active-filter'
import type { DimensionRecord } from '@types'
import { describe, it, expect } from 'vitest'

describe('isActiveFilterDimension', () => {
    it('is inactive with nothing selected', () => {
        expect(isActiveFilterDimension({})).toBe(false)
    })

    it('is inactive with empty items and conditions', () => {
        expect(
            isActiveFilterDimension({
                items: [],
                condition: '',
                legendSetId: '',
            })
        ).toBe(false)
        expect(isActiveFilterDimension({ condition: [] })).toBe(false)
    })

    it('is active with items selected', () => {
        expect(isActiveFilterDimension({ items: ['COMPLETED'] })).toBe(true)
    })

    it('is active with a condition', () => {
        expect(isActiveFilterDimension({ condition: 'GT:5' })).toBe(true)
        expect(isActiveFilterDimension({ condition: ['GT:5'] })).toBe(true)
    })

    it('is active with a legend set', () => {
        expect(isActiveFilterDimension({ legendSetId: 'ls1' })).toBe(true)
    })
})

describe('isActiveFilterDimensionRecord', () => {
    it('reads items, filter and legend set from the record', () => {
        expect(
            isActiveFilterDimensionRecord({
                dimension: 'd1',
                items: [{ id: 'i1' }],
            } as DimensionRecord)
        ).toBe(true)
        expect(
            isActiveFilterDimensionRecord({
                dimension: 'd1',
                filter: 'GT:5',
            } as DimensionRecord)
        ).toBe(true)
        expect(
            isActiveFilterDimensionRecord({
                dimension: 'd1',
                legendSet: { id: 'ls1' },
            } as DimensionRecord)
        ).toBe(true)
    })

    it('is inactive for an org unit group set with nothing selected', () => {
        expect(
            isActiveFilterDimensionRecord({
                dimension: 'J5jldMd8OHv',
                dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
            } as DimensionRecord)
        ).toBe(false)
    })
})
