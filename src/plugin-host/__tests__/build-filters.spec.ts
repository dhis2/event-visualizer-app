import { describe, it, expect } from 'vitest'
import { buildHostFilters } from '../build-filters'

describe('buildHostFilters', () => {
    it('returns an empty object when nothing is selected', () => {
        expect(buildHostFilters({})).toEqual({})
    })

    it('omits keys that are not selected rather than sending empty arrays', () => {
        expect(buildHostFilters({ orgUnitId: 'ImspTQPwCqd' })).toEqual({
            ou: [{ id: 'ImspTQPwCqd', name: 'Sierra Leone' }],
        })
    })

    it('resolves a period id to a named item', () => {
        expect(buildHostFilters({ periodId: 'LAST_12_MONTHS' })).toEqual({
            pe: [{ id: 'LAST_12_MONTHS', name: 'Last 12 months' }],
        })
    })

    it('nests a your-dimension selection under its dimension uid', () => {
        expect(
            buildHostFilters({ yourDimensionKey: 'uIuxlbV1vRT:J40PpdN4Wkk' })
        ).toEqual({
            yourDimensions: {
                uIuxlbV1vRT: [{ id: 'J40PpdN4Wkk', name: 'Northern Area' }],
            },
        })
    })

    it('passes relativePeriodDate through untouched', () => {
        expect(buildHostFilters({ relativePeriodDate: '2024-01-01' })).toEqual({
            relativePeriodDate: '2024-01-01',
        })
    })

    it('combines every selection into one object', () => {
        expect(
            buildHostFilters({
                orgUnitId: 'O6uvpzGd5pu',
                periodId: '202401',
                yourDimensionKey: 'LFsZ8v5v7rq:C6nZpLKjEJr',
                relativePeriodDate: '2024-06-01',
            })
        ).toEqual({
            ou: [{ id: 'O6uvpzGd5pu', name: 'Bo' }],
            pe: [{ id: '202401', name: 'January 2024' }],
            yourDimensions: {
                LFsZ8v5v7rq: [
                    {
                        id: 'C6nZpLKjEJr',
                        name: 'African Medical and Research Foundation',
                    },
                ],
            },
            relativePeriodDate: '2024-06-01',
        })
    })

    it('ignores an unknown id rather than inventing an item', () => {
        expect(buildHostFilters({ orgUnitId: 'not-a-real-id' })).toEqual({})
    })
})
