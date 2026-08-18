import type { CurrentVisualization } from '@types'
import { describe, it, expect } from 'vitest'
import { getBaseRequestIdentity as getLineListBaseRequestIdentity } from './query-tools-line-list'
import { getBaseRequestIdentity as getPivotTableBaseRequestIdentity } from './query-tools-pivot-table'

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

const lineListKey = (
    vis: CurrentVisualization,
    filters?: Record<string, unknown>
) => JSON.stringify(getLineListBaseRequestIdentity(vis, filters))
const pivotTableKey = (
    vis: CurrentVisualization,
    filters?: Record<string, unknown>
) => JSON.stringify(getPivotTableBaseRequestIdentity(vis, filters))

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

    it('changes when the applied filters change', () => {
        expect(
            lineListKey(baseLineList, { relativePeriodDate: '2024-01-01' })
        ).not.toBe(
            lineListKey(baseLineList, { relativePeriodDate: '2024-06-01' })
        )
    })

    it('does not change for filters that are never applied (ou, pe, yourDimensions)', () => {
        expect(lineListKey(baseLineList, { ou: [{ id: 'ou1' }] })).toBe(
            lineListKey(baseLineList)
        )
        expect(lineListKey(baseLineList, { pe: [{ id: 'LAST_YEAR' }] })).toBe(
            lineListKey(baseLineList)
        )
        expect(
            lineListKey(baseLineList, {
                yourDimensions: { d1: [{ id: 'x' }] },
            })
        ).toBe(lineListKey(baseLineList))
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

    it('changes when the applied filters change', () => {
        expect(
            pivotTableKey(basePivotTable, { relativePeriodDate: '2024-01-01' })
        ).not.toBe(
            pivotTableKey(basePivotTable, { relativePeriodDate: '2024-06-01' })
        )
    })

    it('does not change for filters that are never applied (ou, pe, yourDimensions)', () => {
        expect(pivotTableKey(basePivotTable, { ou: [{ id: 'ou1' }] })).toBe(
            pivotTableKey(basePivotTable)
        )
        expect(
            pivotTableKey(basePivotTable, { pe: [{ id: 'LAST_YEAR' }] })
        ).toBe(pivotTableKey(basePivotTable))
        expect(
            pivotTableKey(basePivotTable, {
                yourDimensions: { d1: [{ id: 'x' }] },
            })
        ).toBe(pivotTableKey(basePivotTable))
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
