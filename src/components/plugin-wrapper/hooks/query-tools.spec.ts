import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import {
    getAdaptedVisualization as getAdaptedLineListVisualization,
    getBaseRequestIdentity as getLineListBaseRequestIdentity,
} from './query-tools-line-list'
import {
    getAdaptedVisualization as getAdaptedPivotTableVisualization,
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

describe('getAdaptedVisualization (line list)', () => {
    const SID = 'Zj7UnCAulEk'
    const UID = 'vV9UWAZohSf'
    const LSID = 'OrkEzxZEH4X'

    const buildVis = (
        dim: Record<string, unknown>,
        axis: 'columns' | 'rows' | 'filters' = 'columns'
    ) =>
        ({
            type: 'LINE_LIST',
            outputType: 'EVENT',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [{ id: 'p1' }],
            [axis]: [{ programStage: { id: SID }, ...dim }],
        }) as unknown as CurrentVisualization

    const dimensionsOf = (
        vis: CurrentVisualization,
        axis: 'columns' | 'rows' | 'filters' = 'columns'
    ) =>
        getAdaptedLineListVisualization(vis).adaptedVisualization[axis].map(
            (dim) => (dim as { dimension: string }).dimension
        )

    it('sends a grouped column with the legend set suffix', () => {
        const vis = buildVis({ dimension: UID, legendSet: { id: LSID } })

        expect(dimensionsOf(vis)).toEqual([`${SID}.${UID}-${LSID}`])
    })

    it('asks for the grouped column header without the suffix', () => {
        const vis = buildVis({ dimension: UID, legendSet: { id: LSID } })

        expect(getAdaptedLineListVisualization(vis).headers).toEqual([
            `${SID}.${UID}`,
        ])
    })

    it('keeps the suffix when the grouped column also has a legend filter', () => {
        const vis = buildVis({
            dimension: UID,
            legendSet: { id: LSID },
            filter: 'IN:legend1',
        })

        expect(dimensionsOf(vis)).toEqual([`${SID}.${UID}-${LSID}`])
    })

    it('sends the suffix for a grouped dimension on the filters axis', () => {
        const vis = buildVis(
            { dimension: UID, legendSet: { id: LSID }, filter: 'IN:legend1' },
            'filters'
        )

        expect(dimensionsOf(vis, 'filters')).toEqual([`${SID}.${UID}-${LSID}`])
    })

    it('omits an ungrouped column that constrains nothing, but still asks for its header', () => {
        const vis = buildVis({ dimension: UID })
        const { adaptedVisualization, headers } =
            getAdaptedLineListVisualization(vis)

        expect(adaptedVisualization.columns).toEqual([])
        expect(headers).toEqual([`${SID}.${UID}`])
    })

    it('expands repetition indexes without an undefined stage segment', () => {
        const vis = buildVis({
            dimension: UID,
            items: [{ id: 'item1' }],
            repetition: { indexes: [1, 0, -1] },
        })

        expect(dimensionsOf(vis)).toEqual([
            `${SID}[1].${UID}`,
            `${SID}[0].${UID}`,
            `${SID}[-1].${UID}`,
        ])
    })

    it('matches the headers it requests for a repeated dimension', () => {
        const vis = buildVis({
            dimension: UID,
            items: [{ id: 'item1' }],
            repetition: { indexes: [1, 0] },
        })

        expect(getAdaptedLineListVisualization(vis).headers).toEqual([
            [`${SID}[1].${UID}`, `${SID}[0].${UID}`],
        ])
    })

    /* The library drops items on its own repetition branch, so each expanded
     * record has to carry them itself. */
    it('preserves items on every expanded repetition', () => {
        const vis = buildVis({
            dimension: UID,
            items: [{ id: 'item1' }],
            repetition: { indexes: [1, 0] },
        })
        const { columns } =
            getAdaptedLineListVisualization(vis).adaptedVisualization

        expect(columns).toHaveLength(2)
        for (const column of columns) {
            expect(column).toMatchObject({ items: [{ id: 'item1' }] })
        }
    })

    it('clears the fields the library would otherwise re-apply', () => {
        const vis = buildVis({
            dimension: UID,
            legendSet: { id: LSID },
            repetition: { indexes: [1] },
        })
        const [column] =
            getAdaptedLineListVisualization(vis).adaptedVisualization.columns

        expect(column).toMatchObject({
            program: undefined,
            programStage: undefined,
            legendSet: undefined,
            repetition: undefined,
        })
    })
})

describe('getAdaptedVisualization (pivot table)', () => {
    const SID = 'Zj7UnCAulEk'
    const UID = 'vV9UWAZohSf'
    const LSID = 'OrkEzxZEH4X'

    const groupedDim = {
        dimension: UID,
        programStage: { id: SID },
        legendSet: { id: LSID },
    }

    it.each(['columns', 'rows', 'filters'] as const)(
        'sends the legend set suffix on the %s axis',
        (axis) => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [],
                rows: [],
                filters: [],
                programDimensions: [{ id: 'p1' }],
                [axis]: [groupedDim],
            } as unknown as CurrentVisualization

            expect(
                getAdaptedPivotTableVisualization(vis).adaptedVisualization[
                    axis
                ]
            ).toEqual([
                expect.objectContaining({
                    dimension: `${SID}.${UID}-${LSID}`,
                }),
            ])
        }
    )

    it('keeps a dimension that constrains nothing, unlike the line list', () => {
        const vis = {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [{ dimension: UID, programStage: { id: SID } }],
            rows: [],
            filters: [],
            programDimensions: [{ id: 'p1' }],
        } as unknown as CurrentVisualization

        expect(
            getAdaptedPivotTableVisualization(vis).adaptedVisualization.columns
        ).toEqual([expect.objectContaining({ dimension: `${SID}.${UID}` })])
    })
})
