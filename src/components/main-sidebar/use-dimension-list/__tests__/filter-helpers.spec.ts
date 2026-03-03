import { describe, it, expect } from 'vitest'
import {
    computeIsDisabledByFilter,
    filterDimensions,
    isFetchEnabledByFilter,
} from '../filter-helpers'
import type { DimensionMetadataItem, SingleQuery } from '@types'

describe('isFetchEnabledByFilter', () => {
    it('returns true when filter is null', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(isFetchEnabledByFilter(baseQuery, null)).toBe(true)
    })

    it('returns true when dimension type matches filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')).toBe(true)
    })

    it('returns false when dimension type does not match filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(isFetchEnabledByFilter(baseQuery, 'PERIOD')).toBe(false)
    })

    it('returns true when no dimension type filter in query', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'valueType:eq:TEXT' },
        } as SingleQuery
        expect(isFetchEnabledByFilter(baseQuery, 'DATA_ELEMENT')).toBe(true)
    })
})

describe('filterDimensions', () => {
    const mockDimensions: DimensionMetadataItem[] = [
        {
            id: '1',
            name: 'Data Element 1',
            dimensionType: 'DATA_ELEMENT',
            dimensionItemType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        },
        {
            id: '2',
            name: 'Period 1',
            dimensionType: 'PERIOD',
            dimensionItemType: 'PERIOD',
            valueType: 'NUMBER',
        },
        {
            id: '3',
            name: 'Data Element 2',
            dimensionType: 'DATA_ELEMENT',
            dimensionItemType: 'DATA_ELEMENT',
            valueType: 'NUMBER',
        },
    ]

    it('filters by search term', () => {
        const result = filterDimensions(mockDimensions, 'period', null)
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('2')
    })

    it('filters by dimension type', () => {
        const result = filterDimensions(mockDimensions, '', 'DATA_ELEMENT')
        expect(result).toHaveLength(2)
        expect(result[0].id).toBe('1')
        expect(result[1].id).toBe('3')
    })

    it('filters by both search term and type', () => {
        const result = filterDimensions(
            mockDimensions,
            'element 2',
            'DATA_ELEMENT'
        )
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('3')
    })

    it('returns all dimensions when no filters', () => {
        const result = filterDimensions(mockDimensions, '', null)
        expect(result).toHaveLength(3)
    })

    it('is case insensitive', () => {
        const result = filterDimensions(mockDimensions, 'PERIOD', null)
        expect(result).toHaveLength(1)
    })
})

describe('computeIsDisabledByFilter', () => {
    it('returns false when no filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(computeIsDisabledByFilter(baseQuery, null, [])).toBe(false)
    })

    it('returns false when fetch is enabled', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(computeIsDisabledByFilter(baseQuery, 'DATA_ELEMENT', [])).toBe(
            false
        )
    })

    it('returns true when fetch not enabled and no matching fixed dimensions', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(computeIsDisabledByFilter(baseQuery, 'PERIOD', [])).toBe(true)
    })

    it('returns false when fetch not enabled but has matching fixed dimension', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        expect(computeIsDisabledByFilter(baseQuery, 'PERIOD', ['PERIOD'])).toBe(
            false
        )
    })

    it('handles fixed-only list without baseQuery', () => {
        expect(computeIsDisabledByFilter(undefined, 'DATA_ELEMENT', [])).toBe(
            true
        )
        expect(
            computeIsDisabledByFilter(undefined, 'DATA_ELEMENT', [
                'DATA_ELEMENT',
            ])
        ).toBe(false)
    })
})
