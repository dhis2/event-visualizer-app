import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { getBaseRequestIdentity as getLineListBaseRequestIdentity } from './query-tools-line-list'
import {
    getBaseRequestIdentity as getPivotTableBaseRequestIdentity,
    getLayoutDimensionMetadataNames,
} from './query-tools-pivot-table'

const baseLineList = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    columns: [{ dimension: 'ou', items: [{ id: 'ou1' }] }],
    rows: [],
    filters: [],
    programDimensions: [{ id: 'p1' }],
} as unknown as CurrentVisualization

const basePivotTable = {
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [{ dimension: 'ou', items: [{ id: 'ou1' }] }],
    rows: [],
    filters: [],
    programDimensions: [{ id: 'p1' }],
} as unknown as CurrentVisualization

const lineListKey = (vis: CurrentVisualization, relativePeriodDate?: string) =>
    JSON.stringify(getLineListBaseRequestIdentity(vis, relativePeriodDate))
const pivotTableKey = (
    vis: CurrentVisualization,
    relativePeriodDate?: string
) => JSON.stringify(getPivotTableBaseRequestIdentity(vis, relativePeriodDate))

describe('getRequestStructure (line list)', () => {
    it('changes when the selected items of a dimension change', () => {
        const next = {
            ...baseLineList,
            columns: [{ dimension: 'ou', items: [{ id: 'ou2' }] }],
        } as unknown as CurrentVisualization

        expect(lineListKey(next)).not.toBe(lineListKey(baseLineList))
    })

    it('changes when a filter dimension is added', () => {
        const next = {
            ...baseLineList,
            filters: [
                { dimension: 'eventStatus', items: [{ id: 'COMPLETED' }] },
            ],
        } as unknown as CurrentVisualization

        expect(lineListKey(next)).not.toBe(lineListKey(baseLineList))
    })

    it('changes when the output type changes', () => {
        const next = {
            ...baseLineList,
            outputType: 'ENROLLMENT',
        } as unknown as CurrentVisualization

        expect(lineListKey(next)).not.toBe(lineListKey(baseLineList))
    })

    it('changes when relativePeriodDate changes', () => {
        expect(lineListKey(baseLineList, '2024-01-01')).not.toBe(
            lineListKey(baseLineList, '2024-06-01')
        )
    })

    it('does not change when only the sorting changes', () => {
        const next = {
            ...baseLineList,
            sorting: [{ dimension: 'ou', direction: 'ASC' }],
        } as unknown as CurrentVisualization

        expect(lineListKey(next)).toBe(lineListKey(baseLineList))
    })

    it('does not change when only a client-side option changes', () => {
        const next = {
            ...baseLineList,
            fontSize: 'LARGE',
        } as unknown as CurrentVisualization

        expect(lineListKey(next)).toBe(lineListKey(baseLineList))
    })
})

describe('getRequestStructure (pivot table)', () => {
    it('changes when the selected items of a dimension change', () => {
        const next = {
            ...basePivotTable,
            columns: [{ dimension: 'ou', items: [{ id: 'ou2' }] }],
        } as unknown as CurrentVisualization

        expect(pivotTableKey(next)).not.toBe(pivotTableKey(basePivotTable))
    })

    it('changes when the top limit changes', () => {
        const next = {
            ...basePivotTable,
            topLimit: 50,
        } as unknown as CurrentVisualization

        expect(pivotTableKey(next)).not.toBe(pivotTableKey(basePivotTable))
    })

    it('changes when relativePeriodDate changes', () => {
        expect(pivotTableKey(basePivotTable, '2024-01-01')).not.toBe(
            pivotTableKey(basePivotTable, '2024-06-01')
        )
    })

    it('includes the custom value only when both value and aggregationType are set', () => {
        const aggregationOnly = {
            ...basePivotTable,
            aggregationType: 'AVERAGE',
        } as unknown as CurrentVisualization
        const withCustomValue = {
            ...basePivotTable,
            value: { id: 'de1' },
            aggregationType: 'AVERAGE',
        } as unknown as CurrentVisualization

        expect(pivotTableKey(aggregationOnly)).toBe(
            pivotTableKey(basePivotTable)
        )
        expect(pivotTableKey(withCustomValue)).not.toBe(
            pivotTableKey(basePivotTable)
        )
    })

    it('does not change when only a client-side option changes', () => {
        const next = {
            ...basePivotTable,
            fontSize: 'LARGE',
        } as unknown as CurrentVisualization

        expect(pivotTableKey(next)).toBe(pivotTableKey(basePivotTable))
    })
})

describe('getLayoutDimensionMetadataNames', () => {
    const dimensions = {
        'ps1.ou': { id: 'ps1.ou', name: 'Event org. unit' },
        'ps1.eventDate': { id: 'ps1.eventDate', name: 'Report date' },
        'ps1.de1': { id: 'ps1.de1', name: 'Gender' },
        'p1.enrollmentOu': {
            id: 'p1.enrollmentOu',
            name: 'Enrollment org. unit',
        },
        'p1.programStatus': {
            id: 'p1.programStatus',
            name: 'Enrollment status',
        },
        lastUpdated: { id: 'lastUpdated', name: 'Last updated on' },
    } as unknown as Record<string, DimensionMetadataItem>

    const metadataStore = createMetadataStoreStub({ dimensions })

    it('keys stage-scoped dimensions the way the analytics response does', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [
                {
                    dimension: 'ou',
                    program: { id: 'p1' },
                    programStage: { id: 'ps1' },
                },
            ],
            rows: [
                {
                    dimension: 'eventDate',
                    program: { id: 'p1' },
                    programStage: { id: 'ps1' },
                },
            ],
            filters: [
                {
                    dimension: 'de1',
                    program: { id: 'p1' },
                    programStage: { id: 'ps1' },
                },
            ],
        } as unknown as CurrentVisualization

        expect(getLayoutDimensionMetadataNames(vis, metadataStore)).toEqual({
            'ps1.ou': 'Event org. unit',
            'ps1.eventdate': 'Report date',
            'ps1.de1': 'Gender',
        })
    })

    it('keys enrollment-scoped dimensions without a prefix', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'ENROLLMENT',
            columns: [{ dimension: 'enrollmentOu', program: { id: 'p1' } }],
            rows: [{ dimension: 'programStatus', program: { id: 'p1' } }],
            filters: [],
        } as unknown as CurrentVisualization

        expect(getLayoutDimensionMetadataNames(vis, metadataStore)).toEqual({
            ou: 'Enrollment org. unit',
            programstatus: 'Enrollment status',
        })
    })

    it('includes dimensions the backend omits from metaData.items', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [{ dimension: 'lastUpdated' }],
            rows: [],
            filters: [],
        } as unknown as CurrentVisualization

        expect(getLayoutDimensionMetadataNames(vis, metadataStore)).toEqual({
            lastupdated: 'Last updated on',
        })
    })

    it('skips dimensions the metadata store does not know', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [
                {
                    dimension: 'ou',
                    program: { id: 'p1' },
                    programStage: { id: 'ps1' },
                },
            ],
            rows: [],
            filters: [
                { dimension: 'eventStatus', items: [{ id: 'COMPLETED' }] },
            ],
        } as unknown as CurrentVisualization

        expect(getLayoutDimensionMetadataNames(vis, metadataStore)).toEqual({
            'ps1.ou': 'Event org. unit',
        })
    })

    it('returns an empty lookup for a visualization with no dimensions', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
        } as unknown as CurrentVisualization

        expect(getLayoutDimensionMetadataNames(vis, metadataStore)).toEqual({})
    })
})
