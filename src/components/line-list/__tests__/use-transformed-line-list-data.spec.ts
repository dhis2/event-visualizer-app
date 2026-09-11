import type {
    LineListAnalyticsData,
    LineListAnalyticsDataHeader,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type {
    CurrentVisualization,
    DimensionMetadataItem,
    MetadataItem,
    Program,
} from '@types'
import { describe, it, expect } from 'vitest'
import {
    formatCellValue,
    getHeaderDisplayText,
    transformHeaders,
    transformLineListData,
} from '../use-transformed-line-list-data'

type DisplayTextHeader = Parameters<typeof getHeaderDisplayText>[0]

const buildDisplayTextHeader = (
    partial: DisplayTextHeader
): DisplayTextHeader => partial

describe('getHeaderDisplayText', () => {
    it('returns the base column name when there is no suffix', () => {
        expect(
            getHeaderDisplayText(
                buildDisplayTextHeader({ column: 'Scheduled date' })
            )
        ).toBe('Scheduled date')
    })

    it('appends the contextual dimension suffix to the base name', () => {
        expect(
            getHeaderDisplayText(
                buildDisplayTextHeader({
                    column: 'Scheduled date',
                    dimensionSuffix: 'Birth',
                })
            )
        ).toBe('Scheduled date · Birth')
    })

    it('does not accumulate the suffix across renders of the same header', () => {
        const header = buildDisplayTextHeader({
            column: 'Scheduled date',
            dimensionSuffix: 'Birth',
        })

        const first = getHeaderDisplayText(header)
        const second = getHeaderDisplayText(header)

        expect(first).toBe('Scheduled date · Birth')
        expect(second).toBe('Scheduled date · Birth')
    })

    it('combines the dimension suffix with the repetition suffix', () => {
        expect(
            getHeaderDisplayText(
                buildDisplayTextHeader({
                    column: 'Scheduled date',
                    dimensionSuffix: 'Birth',
                    stageOffset: 0,
                })
            )
        ).toBe('Scheduled date · Birth (most recent)')
    })

    it('returns an empty string when there is no column', () => {
        expect(
            getHeaderDisplayText(
                buildDisplayTextHeader({ dimensionSuffix: 'Birth' })
            )
        ).toBe('')
    })
})

const visualization = {
    outputType: 'EVENT',
    programDimensions: [{ id: 'p1' }],
} as unknown as CurrentVisualization

const buildAnalyticsData = (
    partial: Partial<LineListAnalyticsData>
): LineListAnalyticsData =>
    ({
        headers: [],
        rows: [],
        pager: { page: 1, pageSize: 100, isLastPage: true },
        metaDataItems: {},
        legendSets: [],
        ...partial,
    }) as LineListAnalyticsData

const buildMetadataStore = (scheduledDateName: string) => {
    const dimensionItems: Record<string, Partial<DimensionMetadataItem>> = {
        's1.scheduledDate': {
            name: scheduledDateName,
            programId: 'p1',
            programStageId: 's1',
        },
        's2.scheduledDate': {
            name: scheduledDateName,
            programId: 'p1',
            programStageId: 's2',
        },
    }
    /* Program and stage names come from the store, populated by
     * setVisualizationMetadata in both the app and the plugin. */
    const items: Record<string, { id: string; name: string }> = {
        p1: { id: 'p1', name: 'Antenatal care' },
        s1: { id: 's1', name: 'Birth' },
        s2: { id: 's2', name: 'Baby Postnatal' },
    }
    return createMetadataStoreStub({
        dimensions: dimensionItems as Record<string, DimensionMetadataItem>,
        items: items as Record<string, MetadataItem>,
        programs: items as unknown as Record<string, Program>,
    })
}

describe('transformHeaders', () => {
    it('keeps the base name in column and exposes the stage suffix separately', () => {
        const headers = transformHeaders({
            analyticsData: buildAnalyticsData({
                headers: [
                    {
                        name: 's1.scheduledDate',
                        dimensionId: 's1.scheduledDate',
                    },
                    {
                        name: 's2.scheduledDate',
                        dimensionId: 's2.scheduledDate',
                    },
                ] as LineListAnalyticsDataHeader[],
            }),
            visualization,
            metadataStore: buildMetadataStore('Scheduled date'),
        })

        expect(headers[0]).toMatchObject({
            dimensionId: 's1.scheduledDate',
            column: 'Scheduled date',
            dimensionSuffix: 'Birth',
        })
        expect(headers[1]).toMatchObject({
            dimensionId: 's2.scheduledDate',
            column: 'Scheduled date',
            dimensionSuffix: 'Baby Postnatal',
        })
    })
})

describe('formatCellValue', () => {
    type FormatCellValueParams = Parameters<typeof formatCellValue>[0]
    type FormatCellValueHeader = FormatCellValueParams['header']
    type FormatCellValueMetaDataItems = FormatCellValueParams['metaDataItems']

    const optionSetMetaDataItems = {
        os1: {
            options: [
                { code: 'A', uid: 'optA' },
                { code: 'B', uid: 'optB' },
                { code: 'C', uid: 'optC' },
            ],
        },
        optA: { name: 'Apple' },
        optB: { name: 'Banana' },
        optC: { name: 'Cherry' },
    } as unknown as FormatCellValueMetaDataItems

    const optionSetHeader = {
        valueType: 'TEXT',
        optionSet: 'os1',
    } as unknown as FormatCellValueHeader

    const formatOptionSetValue = (
        rawValue: string,
        metaDataItems: FormatCellValueMetaDataItems = optionSetMetaDataItems
    ) =>
        formatCellValue({
            rawValue,
            header: optionSetHeader,
            visualization,
            metaDataItems,
            isUndefined: false,
        }).formattedValue

    it('resolves an option set value to its option name', () => {
        expect(formatOptionSetValue('A')).toBe('Apple')
    })

    it('resolves each code of a multi-text value and joins the option names', () => {
        expect(formatOptionSetValue('A,B,C')).toBe('Apple, Banana, Cherry')
    })

    /* The analytics API can omit metadata for some option codes (the option's
     * uid entry or its presence in the option set's options array). The missing
     * codes must fall back to the raw code instead of breaking the whole value. */
    it('falls back to the raw code for multi-text codes missing from the metadata', () => {
        const metaDataItemsMissingOption = {
            os1: {
                options: [
                    { code: 'A', uid: 'optA' },
                    { code: 'C', uid: 'optC' },
                ],
            },
            optA: { name: 'Apple' },
            optC: { name: 'Cherry' },
        } as unknown as FormatCellValueMetaDataItems

        expect(formatOptionSetValue('A,B,C', metaDataItemsMissingOption)).toBe(
            'Apple, B, Cherry'
        )
    })

    it('falls back to the raw code when the option uid entry is missing', () => {
        const metaDataItemsMissingName = {
            os1: {
                options: [
                    { code: 'A', uid: 'optA' },
                    { code: 'B', uid: 'optB' },
                ],
            },
            optA: { name: 'Apple' },
        } as unknown as FormatCellValueMetaDataItems

        expect(formatOptionSetValue('A,B', metaDataItemsMissingName)).toBe(
            'Apple, B'
        )
    })

    it('falls back to every raw code when the option set metadata is absent', () => {
        expect(formatOptionSetValue('A,B', {})).toBe('A, B')
    })

    it('formats a boolean value', () => {
        expect(
            formatCellValue({
                rawValue: '1',
                header: { valueType: 'BOOLEAN' } as FormatCellValueHeader,
                visualization,
                metaDataItems: {},
                isUndefined: false,
            })
        ).toEqual({ value: 'Yes', formattedValue: 'Yes' })
    })

    it('blanks out a boolean value of an undefined cell', () => {
        expect(
            formatCellValue({
                rawValue: '1',
                header: { valueType: 'BOOLEAN' } as FormatCellValueHeader,
                visualization,
                metaDataItems: {},
                isUndefined: true,
            }).formattedValue
        ).toBe('')
    })

    it('resolves a metadata item ID (e.g. a legend ID when grouping by legend) to its name', () => {
        expect(
            formatCellValue({
                rawValue: 'legend1',
                header: { valueType: 'TEXT' } as FormatCellValueHeader,
                visualization,
                metaDataItems: {
                    legend1: { name: '60 - 70' },
                } as unknown as FormatCellValueMetaDataItems,
                isUndefined: false,
            }).formattedValue
        ).toBe('60 - 70')
    })

    it('renders a time dimension DATETIME value as a plain date', () => {
        expect(
            formatCellValue({
                rawValue: '2025-08-23 00:00:00.0',
                header: {
                    name: 'eventdate',
                    valueType: 'DATETIME',
                } as FormatCellValueHeader,
                visualization,
                metaDataItems: {},
                isUndefined: false,
            }).formattedValue
        ).toBe('2025-08-23')
    })
})

describe('transformLineListData', () => {
    const legendSet = {
        id: 'ls1',
        name: 'Weight in kg',
        legends: [
            {
                id: 'l1',
                name: '60 - 70',
                startValue: 60,
                endValue: 70,
                color: '#08519c',
            },
        ],
    }
    const analyticsData = buildAnalyticsData({
        headers: [
            {
                name: 'ouname',
                dimensionId: 'ou',
                valueType: 'TEXT',
            },
            {
                name: 's1.weight',
                dimensionId: 's1.weight',
                valueType: 'NUMBER',
            },
        ] as LineListAnalyticsDataHeader[],
        rows: [['Ngelehun CHC', '65']],
        metaDataItems: {
            ou: { name: 'Organisation unit' },
            's1.weight': { name: 'Weight in kg' },
        } as unknown as LineListAnalyticsData['metaDataItems'],
        legendSets: [legendSet],
        pager: { page: 2, pageSize: 50, isLastPage: false },
    })
    const visualizationWithLegend = {
        ...visualization,
        legend: { strategy: 'FIXED', style: 'FILL', set: { id: 'ls1' } },
    } as unknown as CurrentVisualization

    it('produces display-ready headers, formatted cells and passes the pager through', () => {
        const result = transformLineListData({
            analyticsData,
            visualization: visualizationWithLegend,
            metadataStore: createMetadataStoreStub(),
        })

        expect(result.headers).toEqual([
            {
                name: 'ouname',
                displayText: 'Organisation unit',
                dimensionId: 'ou',
            },
            {
                name: 's1.weight',
                displayText: 'Weight in kg',
                dimensionId: 's1.weight',
            },
        ])
        expect(result.rows[0][0]).toMatchObject({
            value: 'Ngelehun CHC',
            formattedValue: 'Ngelehun CHC',
        })
        expect(result.rows[0][1]).toMatchObject({
            value: '65',
            formattedValue: '65',
            backgroundColor: '#08519c',
            shouldNotWrap: true,
        })
        expect(result.pager).toEqual({
            page: 2,
            pageSize: 50,
            isLastPage: false,
        })
    })

    it('exposes the resolved legend sets for the legend key', () => {
        const result = transformLineListData({
            analyticsData,
            visualization: visualizationWithLegend,
            metadataStore: createMetadataStoreStub(),
        })

        expect(result.legendSets).toEqual([legendSet])
    })

    it('resolves no legend sets when the visualization has no legend', () => {
        const result = transformLineListData({
            analyticsData,
            visualization,
            metadataStore: createMetadataStoreStub(),
        })

        expect(result.legendSets).toEqual([])
        expect(result.rows[0][1].backgroundColor).toBeUndefined()
    })
})
