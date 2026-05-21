import { describe, it, expect } from 'vitest'
import { defaultTransformer } from '../default-transformer'

describe('defaultTransformer', () => {
    it('transforms API response correctly', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.dimensions[0].id).toBe('api-id-1')
        expect(result.nextPage).toBe(2)
    })

    it('returns null nextPage on last page', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    dimensionItemType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            ],
            pager: { page: 3, pageCount: 3, pageSize: 50, total: 150 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.nextPage).toBe(null)
    })

    it('throws on invalid response', () => {
        expect(() => defaultTransformer({})).toThrow('Invalid response data')
    })

    it('handles empty dimensions array', () => {
        const mockApiResponse = {
            dimensions: [],
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        const result = defaultTransformer(mockApiResponse)
        expect(result.dimensions).toEqual([])
        expect(result.nextPage).toBe(null)
    })

    it('throws when pager is missing', () => {
        const mockApiResponse = {
            dimensions: [],
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid response data'
        )
    })

    it('throws when pager properties are invalid', () => {
        const mockApiResponse = {
            dimensions: [],
            pager: { page: 'invalid', pageCount: 1, pageSize: 50, total: 0 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid pager structure'
        )
    })

    it('throws when dimensions is not an array', () => {
        const mockApiResponse = {
            dimensions: 'not an array',
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 0 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Dimensions is not an array'
        )
    })

    it('throws when dimension items are invalid', () => {
        const mockApiResponse = {
            dimensions: [
                {
                    id: 'api-id-1',
                    name: 'API Dimension 1',
                    // missing dimensionType, dimensionItemType, valueType
                },
            ],
            pager: { page: 1, pageCount: 3, pageSize: 50, total: 150 },
        }

        expect(() => defaultTransformer(mockApiResponse)).toThrow(
            'Invalid dimension metadata items'
        )
    })
})
