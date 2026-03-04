import { describe, it, expect } from 'vitest'
import {
    buildQuery,
    getFilterParamsFromBaseQuery,
    createDimensionBaseQuery,
    getProgramIndicatorQuery,
    getProgramAttributeQuery,
    getDataElementQuery,
    getDataElementQueryTemplate,
    getOtherDimensionsQuery,
} from '../query-helpers'
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
    const baseQuery: SingleQuery = {
        resource: 'dimensions',
        params: {
            filter: ['dimensionType:eq:DATA_ELEMENT'],
        },
    }

    it('builds query with page number', () => {
        const result = buildQuery(baseQuery, '', 1)
        expect(result.params.page).toBe(1)
        expect(result.resource).toBe('dimensions')
        expect(result.params.filter).toEqual(['dimensionType:eq:DATA_ELEMENT'])
    })

    it('adds search term to filter', () => {
        const result = buildQuery(baseQuery, 'test', 1)
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'displayName:ilike:test',
        ])
    })

    it('preserves existing filters when adding search term', () => {
        const baseQueryWithMultipleFilters: SingleQuery = {
            resource: 'dimensions',
            params: {
                filter: ['dimensionType:eq:DATA_ELEMENT', 'valueType:eq:TEXT'],
            },
        }
        const result = buildQuery(baseQueryWithMultipleFilters, 'search', 2)
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'valueType:eq:TEXT',
            'displayName:ilike:search',
        ])
    })

    it('handles query without params', () => {
        const baseQueryWithoutParams: SingleQuery = {
            resource: 'dimensions',
        }
        const result = buildQuery(baseQueryWithoutParams, '', 1)
        expect(result.params.page).toBe(1)
        expect(result.params.filter).toEqual([])
    })

    it('does not mutate input baseQuery', () => {
        const filter = baseQuery.params?.filter
        if (!filter) {
            throw new Error('Expected filter to be defined')
        }
        const originalFilter = Array.isArray(filter) ? [...filter] : [filter]
        const result = buildQuery(baseQuery, 'test', 1)
        // Original should remain unchanged
        expect(baseQuery.params?.filter).toEqual(originalFilter)
        // Result should have added search term
        expect(result.params.filter).toEqual([
            'dimensionType:eq:DATA_ELEMENT',
            'displayName:ilike:test',
        ])
    })

    it('handles empty search term', () => {
        const result = buildQuery(baseQuery, '', 1)
        expect(result.params.filter).toEqual(['dimensionType:eq:DATA_ELEMENT'])
    })
})

describe('dimension query helpers', () => {
    describe('createDimensionBaseQuery', () => {
        it('creates basic dimension query with displayName', () => {
            const result = createDimensionBaseQuery({
                resource: 'test/resource',
                dimensionType: 'TEST_TYPE',
                nameProp: 'displayName',
            })

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:TEST_TYPE",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                },
                "resource": "test/resource",
              }
            `)
        })

        it('creates basic dimension query with displayShortName', () => {
            const result = createDimensionBaseQuery({
                resource: 'test/resource',
                dimensionType: 'TEST_TYPE',
                nameProp: 'displayShortName',
            })

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayShortName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:TEST_TYPE",
                  "order": "displayShortName:asc",
                  "pageSize": 10,
                  "paging": true,
                },
                "resource": "test/resource",
              }
            `)
        })

        it('includes additional parameters', () => {
            const result = createDimensionBaseQuery({
                resource: 'test/resource',
                dimensionType: 'TEST_TYPE',
                nameProp: 'displayName',
                additionalParams: { customParam: 'value', anotherParam: 123 },
            })

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "anotherParam": 123,
                  "customParam": "value",
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:TEST_TYPE",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                },
                "resource": "test/resource",
              }
            `)
        })

        it('overrides default parameters with additional params', () => {
            const result = createDimensionBaseQuery({
                resource: 'test/resource',
                dimensionType: 'TEST_TYPE',
                nameProp: 'displayName',
                additionalParams: { pageSize: 20, paging: true },
            })

            expect(result.params!.pageSize).toBe(20)
            expect(result.params!.paging).toBe(true)
        })
    })

    describe('getProgramIndicatorQuery', () => {
        it('creates program indicator query with displayName', () => {
            const result = getProgramIndicatorQuery(
                'program-123',
                'displayName'
            )

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:PROGRAM_INDICATOR",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                  "programId": "program-123",
                },
                "resource": "analytics/enrollments/query/dimensions",
              }
            `)
        })

        it('creates program indicator query with displayShortName', () => {
            const result = getProgramIndicatorQuery(
                'program-123',
                'displayShortName'
            )

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayShortName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:PROGRAM_INDICATOR",
                  "order": "displayShortName:asc",
                  "pageSize": 10,
                  "paging": true,
                  "programId": "program-123",
                },
                "resource": "analytics/enrollments/query/dimensions",
              }
            `)
        })
    })

    describe('getProgramAttributeQuery', () => {
        it('creates program attribute query with displayName', () => {
            const result = getProgramAttributeQuery(
                'program-123',
                'tet-456',
                'displayName'
            )

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:PROGRAM_ATTRIBUTE",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                  "program": "program-123",
                  "trackedEntityType": "tet-456",
                },
                "resource": "analytics/trackedEntities/query/dimensions",
              }
            `)
        })
    })

    describe('getDataElementQuery', () => {
        it('creates data element query with displayName', () => {
            const result = getDataElementQuery('stage-789', 'displayName')

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:DATA_ELEMENT",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                  "programStageId": "stage-789",
                },
                "resource": "analytics/events/query/dimensions",
              }
            `)
        })
    })

    describe('getDataElementQueryTemplate', () => {
        it('creates data element query template without programStageId', () => {
            const result = getDataElementQueryTemplate('displayName')

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:DATA_ELEMENT",
                  "order": "displayName:asc",
                  "pageSize": 10,
                  "paging": true,
                },
                "resource": "analytics/events/query/dimensions",
              }
            `)
        })
    })

    describe('getOtherDimensionsQuery', () => {
        it('creates other dimensions query with displayShortName', () => {
            const result = getOtherDimensionsQuery('displayShortName')

            expect(result).toMatchInlineSnapshot(`
              {
                "params": {
                  "fields": "id,displayShortName~rename(name),dimensionType,valueType,optionSet",
                  "filter": "dimensionType:eq:ORGANISATION_UNIT_GROUP_SET",
                  "order": "displayShortName:asc",
                  "pageSize": 10,
                  "paging": true,
                },
                "resource": "dimensions",
              }
            `)
        })
    })
})
