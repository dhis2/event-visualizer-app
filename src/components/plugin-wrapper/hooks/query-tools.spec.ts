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

const lineListKey = (vis: CurrentVisualization) =>
    JSON.stringify(getLineListBaseRequestIdentity(vis))
const pivotTableKey = (vis: CurrentVisualization) =>
    JSON.stringify(getPivotTableBaseRequestIdentity(vis))

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
