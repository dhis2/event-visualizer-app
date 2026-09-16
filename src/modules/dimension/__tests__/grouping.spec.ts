import { isLegendGroupingFilter } from '@modules/conditions'
import {
    canDimensionHaveLegendSets,
    dropInvalidGrouping,
} from '@modules/dimension/grouping'
import type { DimensionArray, DimensionRecord } from '@types'
import { describe, it, expect } from 'vitest'

const LSID = 'OrkEzxZEH4X'
const UID = 'vV9UWAZohSf'

const numericDim = (overrides: Partial<DimensionRecord> = {}) =>
    ({
        dimension: UID,
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        legendSet: { id: LSID },
        ...overrides,
    }) as DimensionRecord

const drop = (dim: DimensionRecord) =>
    dropInvalidGrouping([dim] as DimensionArray)[0]

describe('isLegendGroupingFilter', () => {
    it('accepts a single IN condition', () => {
        expect(isLegendGroupingFilter('IN:legend1;legend2')).toBe(true)
    })

    it.each(['LE:5', 'GE:1:LE:5', 'EQ:NV', 'NE:NV', '!EQ:5'])(
        'rejects %s',
        (condition) => {
            expect(isLegendGroupingFilter(condition)).toBe(false)
        }
    )

    it('rejects an absent condition', () => {
        expect(isLegendGroupingFilter()).toBe(false)
        expect(isLegendGroupingFilter('')).toBe(false)
    })
})

describe('canDimensionHaveLegendSets', () => {
    it('accepts a program indicator with no valueType', () => {
        expect(
            canDimensionHaveLegendSets({ dimensionType: 'PROGRAM_INDICATOR' })
        ).toBe(true)
    })

    it('accepts a numeric data element', () => {
        expect(
            canDimensionHaveLegendSets({
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            })
        ).toBe(true)
    })

    /* normalizeApiSavedVisualization runs before transformDimensions rewrites
     * PROGRAM_DATA_ELEMENT, so the wire spelling must be accepted too. */
    it('accepts the wire PROGRAM_DATA_ELEMENT spelling', () => {
        expect(
            canDimensionHaveLegendSets({
                dimensionType: 'PROGRAM_DATA_ELEMENT',
                valueType: 'INTEGER',
            })
        ).toBe(true)
    })

    /* BOOLEAN and TRUE_ONLY are in NUMERIC_VALUE_TYPES, so they qualify here.
     * Harmless in practice: such data elements carry no legend sets, so the
     * grouping UI never offers one. */
    it.each(['BOOLEAN', 'TRUE_ONLY'] as const)(
        'accepts a %s data element',
        (valueType) => {
            expect(
                canDimensionHaveLegendSets({
                    dimensionType: 'DATA_ELEMENT',
                    valueType,
                })
            ).toBe(true)
        }
    )

    it.each(['TEXT', 'DATE', 'ORGANISATION_UNIT'] as const)(
        'rejects a %s data element',
        (valueType) => {
            expect(
                canDimensionHaveLegendSets({
                    dimensionType: 'DATA_ELEMENT',
                    valueType,
                })
            ).toBe(false)
        }
    )

    it('rejects a dimension with no type information', () => {
        expect(canDimensionHaveLegendSets({})).toBe(false)
    })
})

describe('dropInvalidGrouping', () => {
    it('keeps a legend set with no filter', () => {
        expect(drop(numericDim()).legendSet).toEqual({ id: LSID })
    })

    it('keeps a legend set alongside a legend IN filter', () => {
        const result = drop(numericDim({ filter: 'IN:legend1;legend2' }))

        expect(result.legendSet).toEqual({ id: LSID })
        expect(result.filter).toBe('IN:legend1;legend2')
    })

    it('drops the legend set and keeps a raw-value filter', () => {
        const result = drop(numericDim({ filter: 'LE:5' }))

        expect(result.legendSet).toBeUndefined()
        expect(result.filter).toBe('LE:5')
    })

    it.each(['GE:1:LE:5', 'EQ:NV', 'NE:NV'])(
        'drops the legend set for the %s filter',
        (filter) => {
            expect(drop(numericDim({ filter })).legendSet).toBeUndefined()
        }
    )

    /* Fixed dimensions carry no numeric valueType, so a legend set on one can
     * never apply however it got persisted. */
    it.each([
        [
            'the event org unit',
            { dimension: 'ou', valueType: undefined, dimensionType: undefined },
        ],
        [
            'event status',
            {
                dimension: 'eventStatus',
                valueType: undefined,
                dimensionType: undefined,
            },
        ],
        [
            'a TEXT data element',
            {
                dimensionType: 'DATA_ELEMENT' as const,
                valueType: 'TEXT' as const,
            },
        ],
    ])('drops a legend set on %s', (_label, overrides) => {
        expect(drop(numericDim(overrides)).legendSet).toBeUndefined()
    })

    it('leaves a dimension without a legend set untouched', () => {
        const dim = numericDim({ legendSet: undefined, filter: 'LE:5' })

        expect(drop(dim)).toBe(dim)
    })

    it('leaves a valid dimension referentially unchanged', () => {
        const dim = numericDim()

        expect(drop(dim)).toBe(dim)
    })
})
