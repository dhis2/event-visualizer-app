import { describe, it, expect } from 'vitest'
import { buildQuery, getFilterParamsFromBaseQuery } from '../query-helpers'
import type { SingleQuery } from '@types'

describe('getFilterParamsFromBaseQuery', () => {
    it('returns empty array for undefined baseQuery', () => {
        const result = getFilterParamsFromBaseQuery(undefined)
        expect(result).toEqual([])
    })

    it('returns empty array for baseQuery without params', () => {
        const baseQuery = { resource: 'dimensions' } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('returns empty array for baseQuery without filter param', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { page: 1 },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('handles filter as empty string', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: '' },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([])
    })

    it('splits comma-separated string filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: {
                filter: 'dimensionType:eq:DATA_ELEMENT,dimensionItemType:eq:INDICATOR',
            },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'dimensionItemType:eq:INDICATOR',
        ])
    })

    it('copies array filter', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: {
                filter: [
                    'dimensionType:eq:DATA_ELEMENT',
                    'dimensionItemType:eq:INDICATOR',
                ],
            },
        } as SingleQuery
        const result = getFilterParamsFromBaseQuery(baseQuery)
        expect(result).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'dimensionItemType:eq:INDICATOR',
        ])
        // Ensure it's a copy, not the same reference
        expect(result).not.toBe(baseQuery.params!.filter)
    })

    it('throws on invalid filter format', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 123 },
        } as unknown as SingleQuery
        expect(() => getFilterParamsFromBaseQuery(baseQuery)).toThrow(
            'Invalid filter query params'
        )
    })

    it('throws on array with non-string items', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: ['valid', 123] },
        } as unknown as SingleQuery
        expect(() => getFilterParamsFromBaseQuery(baseQuery)).toThrow(
            'Invalid filter query params'
        )
    })
})

describe('buildQuery', () => {
    it('builds query with search term', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        const result = buildQuery(baseQuery, 'test', 1)
        expect(result.params.filter).toContain('dimensionType:eq:DATA_ELEMENT')
        expect(result.params.filter).toContain('displayName:ilike:test')
        expect(result.params.page).toBe(1)
    })

    it('builds query without search term', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: { filter: 'dimensionType:eq:DATA_ELEMENT' },
        } as SingleQuery
        const result = buildQuery(baseQuery, '', 2)
        expect(result.params.filter).toEqual(['dimensionType:eq:DATA_ELEMENT'])
        expect(result.params.page).toBe(2)
    })

    it('handles array filters', () => {
        const baseQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT', 'valueType:eq:TEXT'],
            },
        } as SingleQuery
        const result = buildQuery(baseQuery, 'search', 1)
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'valueType:eq:TEXT',
            'displayName:ilike:search',
        ])
    })
})
