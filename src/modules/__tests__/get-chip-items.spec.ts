import { describe, it, expect } from 'vitest'
import { getChipItemsText } from '../get-chip-items-text'

describe('getChipItems', () => {
    describe('when axisId is "columns"', () => {
        it('returns empty string for organization unit dimension with no items (non-tracked entity)', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('')
        })

        it('returns empty string for period dimension with no items', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'pe', dimensionType: 'PERIOD' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('')
        })

        it('returns "all" when no conditions or items', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'dx', dimensionType: 'DATA_ELEMENT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns "all" for TRUE_ONLY value type with 1 condition', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'de1', valueType: 'TRUE_ONLY' },
                    conditionsLength: 1,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns "all" for BOOLEAN value type with 2 conditions', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'de2', valueType: 'BOOLEAN' },
                    conditionsLength: 2,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns items length for dimension with option set', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'de3', optionSet: 'optionSet1' },
                    conditionsLength: undefined,
                    itemsLength: 3,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('3')
        })

        it('returns items length for dimension with items but no option set', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'de4' },
                    conditionsLength: undefined,
                    itemsLength: 5,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('5')
        })

        it('returns conditions length for dimension with only conditions', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'de5' },
                    conditionsLength: 2,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('2')
        })

        it('returns items length for organization unit with TRACKED_ENTITY_INSTANCE', () => {
            expect(
                getChipItemsText({
                    dimension: { id: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                    conditionsLength: undefined,
                    itemsLength: 4,
                    inputType: 'TRACKED_ENTITY_INSTANCE',
                    axisId: 'columns',
                })
            ).toBe('4')
        })
    })

    describe('when axisId is "filters"', () => {
        it('returns empty string when no conditions or items', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns condition count for TRUE_ONLY valueType with 1 condition', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension', valueType: 'TRUE_ONLY' },
                conditionsLength: 1,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('1')
        })

        it('returns condition count for BOOLEAN valueType with 2 conditions', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension', valueType: 'BOOLEAN' },
                conditionsLength: 2,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('2')
        })

        it('returns itemsLength when dimension has optionSet and items', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension', optionSet: 'testOptionSet' },
                conditionsLength: undefined,
                itemsLength: 3,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('3')
        })

        it('returns empty string for dimension with option set and no items', () => {
            const result = getChipItemsText({
                dimension: { id: 'de3', optionSet: 'optionSet1' },
                conditionsLength: undefined,
                itemsLength: 0,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns conditionsLength when no optionSet or itemsLength', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension' },
                conditionsLength: 5,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('5')
        })

        it('returns empty string for organization units with no itemsLength (same as other axes)', () => {
            const result = getChipItemsText({
                dimension: { id: 'ou' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns empty string for period dimensions with no itemsLength (same as other axes)', () => {
            const result = getChipItemsText({
                dimension: { id: 'testDimension', dimensionType: 'PERIOD' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe('')
        })
    })
})
