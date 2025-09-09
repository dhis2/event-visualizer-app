import { describe, it, expect } from 'vitest'
import { getChipItems } from '../get-chip-items'

describe('getChipItems', () => {
    describe('when axisId is "columns"', () => {
        it('returns correct values for different dimension scenarios', () => {
            // Test case 1: Organization unit dimension with no items (non-tracked entity) returns null
            expect(
                getChipItems({
                    dimension: { id: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe(null)

            // Test case 2: Period dimension with no items returns null
            expect(
                getChipItems({
                    dimension: { id: 'pe', dimensionType: 'PERIOD' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe(null)

            // Test case 3: No conditions/items and not in filters returns 'all'
            expect(
                getChipItems({
                    dimension: { id: 'dx', dimensionType: 'DATA_ELEMENT' },
                    conditionsLength: undefined,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')

            // Test case 4: TRUE_ONLY value type with 1 condition returns 'all'
            expect(
                getChipItems({
                    dimension: { id: 'de1', valueType: 'TRUE_ONLY' },
                    conditionsLength: 1,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')

            // Test case 5: BOOLEAN value type with 2 conditions returns 'all'
            expect(
                getChipItems({
                    dimension: { id: 'de2', valueType: 'BOOLEAN' },
                    conditionsLength: 2,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe('all')

            // Test case 6: Dimension with option set returns items length
            expect(
                getChipItems({
                    dimension: { id: 'de3', optionSet: 'optionSet1' },
                    conditionsLength: undefined,
                    itemsLength: 3,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe(3)

            // Test case 7: Dimension with items but no option set returns items length
            expect(
                getChipItems({
                    dimension: { id: 'de4' },
                    conditionsLength: undefined,
                    itemsLength: 5,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe(5)

            // Test case 8: Dimension with only conditions returns conditions length
            expect(
                getChipItems({
                    dimension: { id: 'de5' },
                    conditionsLength: 2,
                    itemsLength: undefined,
                    inputType: 'EVENT',
                    axisId: 'columns',
                })
            ).toBe(2)

            // Test case 9: Organization unit for TRACKED_ENTITY_INSTANCE with items returns items length
            expect(
                getChipItems({
                    dimension: { id: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                    conditionsLength: undefined,
                    itemsLength: 4,
                    inputType: 'TRACKED_ENTITY_INSTANCE',
                    axisId: 'columns',
                })
            ).toBe(4)
        })

        it.skip('should handle optionSet without itemsLength bug - currently returns 0 instead of proper handling', () => {
            // Bug: When a dimension has an optionSet but no itemsLength,
            // the function returns 0 which shows on the chip without proper styling
            // Example: "Gender" dimension falls into this category
            const result = getChipItems({
                dimension: { id: 'gender', optionSet: 'genderOptionSet' },
                conditionsLength: undefined,
                itemsLength: undefined, // This is the problematic case
                inputType: 'EVENT',
                axisId: 'columns',
            })

            // Currently returns 0 (bug), but should probably return null or 'all'
            expect(result).toBe(0) // This documents the current buggy behavior

            // TODO: When bug is fixed, this test should be updated to expect
            // the correct behavior, possibly:
            // expect(result).toBe(null) or expect(result).toBe('all')
        })
    })

    describe('when axisId is "filters"', () => {
        it('returns null when no conditions or items', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(null)
        })

        it('returns condition count for TRUE_ONLY valueType with 1 condition', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension', valueType: 'TRUE_ONLY' },
                conditionsLength: 1,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(1)
        })

        it('returns condition count for BOOLEAN valueType with 2 conditions', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension', valueType: 'BOOLEAN' },
                conditionsLength: 2,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(2)
        })

        it('returns itemsLength when dimension has optionSet and items', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension', optionSet: 'testOptionSet' },
                conditionsLength: undefined,
                itemsLength: 3,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(3)
        })

        it('returns conditionsLength when no optionSet or itemsLength', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension' },
                conditionsLength: 5,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(5)
        })

        it('returns null for organization units with no itemsLength (same as other axes)', () => {
            const result = getChipItems({
                dimension: { id: 'ou' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(null)
        })

        it('returns null for period dimensions with no itemsLength (same as other axes)', () => {
            const result = getChipItems({
                dimension: { id: 'testDimension', dimensionType: 'PERIOD' },
                conditionsLength: undefined,
                itemsLength: undefined,
                inputType: 'EVENT',
                axisId: 'filters',
            })

            expect(result).toBe(null)
        })
    })
})
