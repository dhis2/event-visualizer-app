import type { UseMetadataStoreReturnValue } from '@components/app-wrapper/metadata-provider/metadata-provider'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { extractHeaders, formatRowValue } from './use-line-list-analytics-data'

const visualization = {
    outputType: 'EVENT',
    programDimensions: [{ id: 'p1' }],
} as unknown as CurrentVisualization

const analyticsResponse = {
    headers: [{ name: 's1.scheduledDate' }, { name: 's2.scheduledDate' }],
    metaData: {
        items: {
            s1: { name: 'Birth' },
            s2: { name: 'Baby Postnatal' },
        },
    },
}

const buildMetadataStore = (
    scheduledDateName: string
): UseMetadataStoreReturnValue => {
    const items: Record<string, Partial<DimensionMetadataItem>> = {
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
    return {
        getDimensionMetadataItem: (id: string) => items[id],
    } as unknown as UseMetadataStoreReturnValue
}

describe('extractHeaders', () => {
    it('keeps the base name in column and exposes the stage suffix separately', () => {
        const headers = extractHeaders(
            analyticsResponse,
            visualization,
            buildMetadataStore('Scheduled date')
        )

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

describe('formatRowValue', () => {
    const optionSetMetaData = {
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
    }

    const optionSetHeader = { valueType: 'TEXT', optionSet: 'os1' }

    it('resolves an option set value to its option name', () => {
        expect(
            formatRowValue({
                rowValue: 'A',
                header: optionSetHeader,
                metaDataItems: optionSetMetaData,
                isUndefined: false,
            })
        ).toBe('Apple')
    })

    it('resolves each code of a multi-text value and joins the option names', () => {
        expect(
            formatRowValue({
                rowValue: 'A,B,C',
                header: optionSetHeader,
                metaDataItems: optionSetMetaData,
                isUndefined: false,
            })
        ).toBe('Apple, Banana, Cherry')
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
        }

        expect(
            formatRowValue({
                rowValue: 'A,B,C',
                header: optionSetHeader,
                metaDataItems: metaDataItemsMissingOption,
                isUndefined: false,
            })
        ).toBe('Apple, B, Cherry')
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
        }

        expect(
            formatRowValue({
                rowValue: 'A,B',
                header: optionSetHeader,
                metaDataItems: metaDataItemsMissingName,
                isUndefined: false,
            })
        ).toBe('Apple, B')
    })

    it('falls back to every raw code when the option set metadata is absent', () => {
        expect(
            formatRowValue({
                rowValue: 'A,B',
                header: optionSetHeader,
                metaDataItems: {},
                isUndefined: false,
            })
        ).toBe('A, B')
    })
})
