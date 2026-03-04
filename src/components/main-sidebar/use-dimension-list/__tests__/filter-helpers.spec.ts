import { describe, it, expect } from 'vitest'
import {
    computeIsDisabledByFilter,
    filterDimensions,
    isFetchEnabledByFilter,
} from '../filter-helpers'
import type { DimensionMetadataItem, SingleQuery, DimensionType } from '@types'

describe('isFetchEnabledByFilter', () => {
    const baseQueryWithDimensionType: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }

    const baseQueryWithoutDimensionType: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['displayName:ilike:test'],
        },
    }

    const baseQueryWithoutFilter: SingleQuery = {
        resource: 'dimensions',
    }

    it('returns true when filter is null', () => {
        const result = isFetchEnabledByFilter(baseQueryWithDimensionType, null)
        expect(result).toBe(true)
    })

    it('returns true when filter matches dimension type in query', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithDimensionType,
            'DATA_ELEMENT'
        )
        expect(result).toBe(true)
    })

    it('returns false when filter does not match dimension type in query', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithDimensionType,
            'PROGRAM_INDICATOR'
        )
        expect(result).toBe(false)
    })

    it('returns true when query has no dimension type filter', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutDimensionType,
            'PROGRAM_INDICATOR'
        )
        expect(result).toBe(true)
    })

    it('returns true when query has no dimension type filter and filter is null', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutDimensionType,
            null
        )
        expect(result).toBe(true)
    })

    it('returns true when baseQuery has no params', () => {
        const result = isFetchEnabledByFilter(
            baseQueryWithoutFilter,
            'DATA_ELEMENT'
        )
        expect(result).toBe(true)
    })

    it('returns true when baseQuery has params but no filter', () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {},
        }
        const result = isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })

    it('handles dimension type filter with extra characters', () => {
        const baseQuery: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'displayName:ilike:test',
                ],
            },
        }
        const result = isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })
})

describe('filterDimensions', () => {
    const createDimension = (
        overrides?: Partial<DimensionMetadataItem>
    ): DimensionMetadataItem => ({
        id: 'test-id',
        name: 'Test Dimension',
        dimensionType: 'DATA_ELEMENT',
        dimensionItemType: 'DATA_ELEMENT',
        valueType: 'TEXT',
        ...overrides,
    })

    const dimensions = [
        createDimension({
            id: '1',
            name: 'Apple',
            dimensionType: 'DATA_ELEMENT',
        }),
        createDimension({
            id: '2',
            name: 'Banana',
            dimensionType: 'DATA_ELEMENT',
        }),
        createDimension({
            id: '3',
            name: 'Cherry',
            dimensionType: 'PROGRAM_INDICATOR',
        }),
        createDimension({
            id: '4',
            name: 'Apricot',
            dimensionType: 'PROGRAM_INDICATOR',
        }),
    ]

    it('returns all dimensions when no search term and no filter', () => {
        const result = filterDimensions(dimensions, '', null)
        expect(result).toEqual(dimensions)
    })

    it('filters by search term (case-insensitive)', () => {
        const result = filterDimensions(dimensions, 'ap', null)
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '4',
                name: 'Apricot',
                dimensionType: 'PROGRAM_INDICATOR',
            }),
        ])
    })

    it('filters by dimension type', () => {
        const result = filterDimensions(dimensions, '', 'DATA_ELEMENT')
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
        ])
    })

    it('filters by both search term and dimension type (AND logic)', () => {
        const result = filterDimensions(dimensions, 'a', 'DATA_ELEMENT')
        expect(result).toEqual([
            createDimension({
                id: '1',
                name: 'Apple',
                dimensionType: 'DATA_ELEMENT',
            }),
            createDimension({
                id: '2',
                name: 'Banana',
                dimensionType: 'DATA_ELEMENT',
            }),
        ])
    })

    it('returns empty array when no matches', () => {
        const result = filterDimensions(dimensions, 'xyz', 'DATA_ELEMENT')
        expect(result).toEqual([])
    })

    it('handles empty dimensions array', () => {
        const result = filterDimensions([], 'test', 'DATA_ELEMENT')
        expect(result).toEqual([])
    })

    it('returns empty array when filter matches no dimensions', () => {
        const result = filterDimensions(dimensions, '', 'STATUS')
        expect(result).toEqual([])
    })

    it('preserves order of filtered dimensions', () => {
        const result = filterDimensions(dimensions, '', 'DATA_ELEMENT')
        expect(result.map((d) => d.id)).toEqual(['1', '2'])
    })
})

describe('computeIsDisabledByFilter', () => {
    it('returns false when filter matches baseQuery dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, 'DATA_ELEMENT')
        expect(result).toBe(false)
    })

    it('returns true when filter does not match baseQuery dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, 'PROGRAM_INDICATOR')
        expect(result).toBe(true)
    })

    it('returns false when filter is null', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(baseQuery, null)
        expect(result).toBe(false)
    })

    it('returns false when fixedDimensionTypes contains matching dimension type', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const fixedDimensionTypes: DimensionType[] = [
            'PROGRAM_INDICATOR',
            'DATA_ELEMENT',
        ]
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            fixedDimensionTypes
        )
        expect(result).toBe(false)
    })

    it('returns true when filter does not match baseQuery or any fixedDimensionTypes', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const fixedDimensionTypes: DimensionType[] = [
            'DATA_ELEMENT',
            'DATA_ELEMENT',
        ]
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            fixedDimensionTypes
        )
        expect(result).toBe(true)
    })

    it('returns true when fixedDimensionTypes is empty and filter does not match baseQuery', () => {
        const baseQuery: SingleQuery = {
            resource: 'dataElements',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'domainType:eq:TRACKER',
                ],
            },
        }
        const result = computeIsDisabledByFilter(
            baseQuery,
            'PROGRAM_INDICATOR',
            []
        )
        expect(result).toBe(true)
    })

    it('returns true when no baseQuery and no fixedDimensionTypes provided', () => {
        const result = computeIsDisabledByFilter(undefined, 'DATA_ELEMENT')
        expect(result).toBe(true)
    })

    it('returns false when no baseQuery but fixedDimensionTypes match filter', () => {
        const fixedDimensionTypes: DimensionType[] = ['DATA_ELEMENT']
        const result = computeIsDisabledByFilter(
            undefined,
            'DATA_ELEMENT',
            fixedDimensionTypes
        )
        expect(result).toBe(false)
    })

    it('handles baseQuery without dimension type filter', () => {
        const baseQueryWithoutDimensionType: SingleQuery = {
            resource: 'programIndicators',
            params: {
                filter: ['program.id:eq:abc123'],
            },
        }
        const result = computeIsDisabledByFilter(
            baseQueryWithoutDimensionType,
            'DATA_ELEMENT'
        )
        expect(result).toBe(false)
    })

    it('returns false when no baseQuery and filter is null (fixed-only list with no filter)', () => {
        const result = computeIsDisabledByFilter(undefined, null)
        expect(result).toBe(false)
    })

    it('returns true when no baseQuery and filter does not match fixedDimensionTypes', () => {
        const fixedDimensionTypes: DimensionType[] = [
            'DATA_ELEMENT',
            'PROGRAM_INDICATOR',
        ]
        const result = computeIsDisabledByFilter(
            undefined,
            'CATEGORY',
            fixedDimensionTypes
        )
        expect(result).toBe(true)
    })
})
