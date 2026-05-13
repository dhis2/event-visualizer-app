import { describe, it, expect } from 'vitest'
import { getChipItemsText } from '../get-chip-items-text'

describe('getChipItemsText', () => {
    describe('when axisId is "columns"', () => {
        it('returns empty string for a non-TE organisation unit dimension with no items', () => {
            expect(
                getChipItemsText({
                    dimension: { dimensionType: 'ORGANISATION_UNIT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('')
        })

        it('returns empty string for period dimension with no items', () => {
            expect(
                getChipItemsText({
                    dimension: { dimensionType: 'PERIOD' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('')
        })

        it('returns "all" when no conditions or items', () => {
            expect(
                getChipItemsText({
                    dimension: { dimensionType: 'DATA_ELEMENT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns "all" for TRUE_ONLY value type with 1 condition', () => {
            expect(
                getChipItemsText({
                    dimension: { valueType: 'TRUE_ONLY' },
                    conditionsLength: 1,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns "all" for BOOLEAN value type with 2 conditions', () => {
            expect(
                getChipItemsText({
                    dimension: { valueType: 'BOOLEAN' },
                    conditionsLength: 2,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('all')
        })

        it('returns items length for dimension with option set', () => {
            expect(
                getChipItemsText({
                    dimension: { optionSet: 'optionSet1' },
                    conditionsLength: undefined,
                    itemsLength: 3,
                    axisId: 'columns',
                })
            ).toBe('3')
        })

        it('returns items length for dimension with items but no option set', () => {
            expect(
                getChipItemsText({
                    dimension: {},
                    conditionsLength: undefined,
                    itemsLength: 5,
                    axisId: 'columns',
                })
            ).toBe('5')
        })

        it('returns conditions length for dimension with only conditions', () => {
            expect(
                getChipItemsText({
                    dimension: {},
                    conditionsLength: 2,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('2')
        })

        it('returns items length for TE-scope (registration) organisation unit', () => {
            expect(
                getChipItemsText({
                    dimension: {
                        dimensionType: 'ORGANISATION_UNIT',
                        trackedEntityTypeId: 'tet1',
                    },
                    conditionsLength: undefined,
                    itemsLength: 4,
                    axisId: 'columns',
                })
            ).toBe('4')
        })

        it('returns "all" for a TE-scope (registration) organisation unit with no items', () => {
            expect(
                getChipItemsText({
                    dimension: {
                        dimensionType: 'ORGANISATION_UNIT',
                        trackedEntityTypeId: 'tet1',
                    },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    axisId: 'columns',
                })
            ).toBe('all')
        })
    })

    describe('when axisId is "filters"', () => {
        it('returns empty string when no conditions or items', () => {
            const result = getChipItemsText({
                dimension: {},
                conditionsLength: undefined,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns condition count for TRUE_ONLY valueType with 1 condition', () => {
            const result = getChipItemsText({
                dimension: { valueType: 'TRUE_ONLY' },
                conditionsLength: 1,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('1')
        })

        it('returns condition count for BOOLEAN valueType with 2 conditions', () => {
            const result = getChipItemsText({
                dimension: { valueType: 'BOOLEAN' },
                conditionsLength: 2,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('2')
        })

        it('returns itemsLength when dimension has optionSet and items', () => {
            const result = getChipItemsText({
                dimension: { optionSet: 'testOptionSet' },
                conditionsLength: undefined,
                itemsLength: 3,
                axisId: 'filters',
            })

            expect(result).toBe('3')
        })

        it('returns empty string for dimension with option set and no items', () => {
            const result = getChipItemsText({
                dimension: { optionSet: 'optionSet1' },
                conditionsLength: undefined,
                itemsLength: 0,
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns conditionsLength when no optionSet or itemsLength', () => {
            const result = getChipItemsText({
                dimension: {},
                conditionsLength: 5,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('5')
        })

        it('returns empty string for non-TE organisation units with no itemsLength', () => {
            const result = getChipItemsText({
                dimension: { dimensionType: 'ORGANISATION_UNIT' },
                conditionsLength: undefined,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('')
        })

        it('returns empty string for period dimensions with no itemsLength', () => {
            const result = getChipItemsText({
                dimension: { dimensionType: 'PERIOD' },
                conditionsLength: undefined,
                itemsLength: undefined,
                axisId: 'filters',
            })

            expect(result).toBe('')
        })
    })
})
