/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import {
    normalizeMetadataInputItem,
    normalizeOrganisationUnitMetadataItem,
} from '../normalization'

describe('normalization', () => {
    describe('normalizeOrganisationUnitMetadataItem', () => {
        it('returns input as-is', () => {
            const orgUnit = {
                id: 'ou123',
                path: '/A/B/C',
                name: 'Test Org Unit',
            }
            expect(normalizeOrganisationUnitMetadataItem(orgUnit)).toBe(orgUnit)
        })
    })
    describe('normalizeMetadataInputItem', () => {
        describe('MetadataItem (with uid)', () => {
            it('should normalize MetadataItem with uid to id', () => {
                const input = {
                    uid: 'test-uid',
                    name: 'Test Item',
                    code: 'TEST',
                    description: 'Test description',
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'test-uid',
                    name: 'Test Item',
                    code: 'TEST',
                    description: 'Test description',
                    options: [],
                    style: {},
                })
            })

            it('should handle MetadataItem with complex properties', () => {
                const input = {
                    uid: 'test-uid',
                    name: 'Test Item',
                    aggregationType: 'SUM',
                    dimensionItemType: 'DATA_ELEMENT',
                    dimensionType: 'DATA_X',
                    totalAggregationType: 'SUM',
                    valueType: 'NUMBER',
                    indicatorType: { id: 'type1' },
                    style: { color: 'red' },
                    options: [{ id: 'opt1' }],
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'test-uid',
                    name: 'Test Item',
                    aggregationType: 'SUM',
                    dimensionItemType: 'DATA_ELEMENT',
                    dimensionType: 'DATA_X',
                    totalAggregationType: 'SUM',
                    valueType: 'NUMBER',
                    indicatorType: { id: 'type1' },
                    style: { color: 'red' },
                    options: [{ id: 'opt1' }],
                })
            })
        })

        describe('SimpleMetadataItem (key-value pair)', () => {
            it('should normalize SimpleMetadataItem', () => {
                const input = { TODAY: 'Today' }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'TODAY',
                    name: 'Today',
                })
            })

            it('should normalize SimpleMetadataItem with different key-value', () => {
                const input = { USER_ORGUNIT: 'User organisation unit' }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'USER_ORGUNIT',
                    name: 'User organisation unit',
                })
            })

            it('should correctly identify single key-value object as SimpleMetadataItem', () => {
                const input = { someProperty: 'value' }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'someProperty',
                    name: 'value',
                })
            })
        })

        describe('ProgramMetadataItem', () => {
            it('should normalize ProgramMetadataItem with required fields', () => {
                const input = {
                    id: 'prog1',
                    programType: 'WITH_REGISTRATION' as const,
                    name: 'Test Program',
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'prog1',
                    programType: 'WITH_REGISTRATION',
                    name: 'Test Program',
                    programStages: [],
                })
            })

            it('should normalize ProgramMetadataItem with optional fields', () => {
                const input = {
                    id: 'prog1',
                    programType: 'WITHOUT_REGISTRATION' as const,
                    name: 'Test Program',
                    code: 'PROG1',
                    displayIncidentDate: true,
                    programStages: [
                        { id: 'stage1', repeatable: false, name: 'Stage 1' },
                        { id: 'stage2', repeatable: true, name: 'Stage 2' },
                    ],
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'prog1',
                    programType: 'WITHOUT_REGISTRATION',
                    name: 'Test Program',
                    code: 'PROG1',
                    displayIncidentDate: true,
                    programStages: [
                        { id: 'stage1', repeatable: false, name: 'Stage 1' },
                        { id: 'stage2', repeatable: true, name: 'Stage 2' },
                    ],
                })
            })
        })

        describe('OptionSetMetadataItem', () => {
            it('should normalize OptionSetMetadataItem with required fields', () => {
                const input = {
                    id: 'optset1',
                    name: 'Test Option Set',
                    options: [
                        { id: 'opt1', name: 'Option 1' },
                        { id: 'opt2', name: 'Option 2' },
                    ],
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'optset1',
                    name: 'Test Option Set',
                    attributeValues: [],
                    options: [
                        { id: 'opt1', name: 'Option 1' },
                        { id: 'opt2', name: 'Option 2' },
                    ],
                    sharing: {},
                    translations: [],
                })
            })

            it('should normalize OptionSetMetadataItem with optional fields', () => {
                const input = {
                    id: 'optset1',
                    name: 'Test Option Set',
                    code: 'OPTSET1',
                    description: 'Test option set description',
                    created: '2023-01-01',
                    lastUpdated: '2023-01-02',
                    valueType: 'TEXT',
                    options: [{ id: 'opt1', name: 'Option 1' }],
                    attributeValues: [{ attribute: 'attr1', value: 'val1' }],
                    sharing: { public: true },
                    translations: [
                        {
                            property: 'NAME',
                            locale: 'en',
                            value: 'English Name',
                        },
                    ],
                }
                const result = normalizeMetadataInputItem(input as any)

                expect(result).toEqual({
                    id: 'optset1',
                    name: 'Test Option Set',
                    code: 'OPTSET1',
                    description: 'Test option set description',
                    created: '2023-01-01',
                    lastUpdated: '2023-01-02',
                    valueType: 'TEXT',
                    attributeValues: [{ attribute: 'attr1', value: 'val1' }],
                    options: [{ id: 'opt1', name: 'Option 1' }],
                    sharing: { public: true },
                    translations: [
                        {
                            property: 'NAME',
                            locale: 'en',
                            value: 'English Name',
                        },
                    ],
                })
            })
        })

        describe('Error handling', () => {
            it('should throw error for unknown metadata input type', () => {
                const input = { someProperty: 123, anotherProperty: true } // Multiple properties, non-string values
                expect(() => normalizeMetadataInputItem(input as any)).toThrow(
                    'Unknown metadata input type'
                )
            })

            it('should throw error for null input', () => {
                expect(() => normalizeMetadataInputItem(null as any)).toThrow(
                    "Cannot use 'in' operator"
                )
            })

            it('should throw error for undefined input', () => {
                expect(() =>
                    normalizeMetadataInputItem(undefined as any)
                ).toThrow("Cannot use 'in' operator")
            })
        })

        describe('Property stripping and filtering', () => {
            describe('MetadataItem property stripping', () => {
                it('should strip unknown properties from MetadataItem', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        code: 'TEST',
                        unknownProperty: 'should be stripped',
                        anotherUnknown: { nested: 'object' },
                        randomArray: [1, 2, 3],
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        code: 'TEST',
                        options: [],
                        style: {},
                    })
                    expect((result as any).unknownProperty).toBeUndefined()
                    expect((result as any).anotherUnknown).toBeUndefined()
                    expect((result as any).randomArray).toBeUndefined()
                })

                it('should handle undefined optional properties correctly', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        // Complex fields should be defaulted to empty structures
                        options: [],
                        style: {},
                    })
                    // Primitive fields should be omitted when undefined
                    expect((result as any).code).toBeUndefined()
                    expect((result as any).description).toBeUndefined()
                    expect((result as any).aggregationType).toBeUndefined()
                    expect((result as any).dimensionItemType).toBeUndefined()
                    expect((result as any).dimensionType).toBeUndefined()
                    expect((result as any).totalAggregationType).toBeUndefined()
                    expect((result as any).valueType).toBeUndefined()
                    // Complex objects with required properties should be omitted when undefined
                    expect((result as any).indicatorType).toBeUndefined()
                })

                it('should default complex array and object fields to empty structures', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        // Not providing options and style at all
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        options: [], // Should default to empty array
                        style: {}, // Should default to empty object
                    })
                })

                it('should preserve provided complex fields', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        options: [{ key: 'value' }],
                        style: { color: 'red', icon: 'star' },
                        indicatorType: { factor: 1, name: 'Type1' },
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        options: [{ key: 'value' }],
                        style: { color: 'red', icon: 'star' },
                        indicatorType: { factor: 1, name: 'Type1' },
                    })
                })
            })

            describe('ProgramMetadataItem property stripping', () => {
                it('should strip unknown properties from ProgramMetadataItem', () => {
                    const input = {
                        id: 'prog1',
                        programType: 'WITH_REGISTRATION' as const,
                        name: 'Test Program',
                        extraField: 'should be removed',
                        invalidProperty: { complex: 'object' },
                        randomNumbers: [1, 2, 3],
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'prog1',
                        programType: 'WITH_REGISTRATION',
                        name: 'Test Program',
                        programStages: [],
                    })
                    expect((result as any).extraField).toBeUndefined()
                    expect((result as any).invalidProperty).toBeUndefined()
                    expect((result as any).randomNumbers).toBeUndefined()
                })

                it('should preserve only valid optional properties', () => {
                    const input = {
                        id: 'prog1',
                        programType: 'WITHOUT_REGISTRATION' as const,
                        name: 'Test Program',
                        code: 'VALID_CODE',
                        displayIncidentDate: true,
                        invalidCode: 'INVALID',
                        extraDisplayFlag: false,
                        customProperty: 'custom',
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'prog1',
                        programType: 'WITHOUT_REGISTRATION',
                        name: 'Test Program',
                        code: 'VALID_CODE',
                        displayIncidentDate: true,
                        programStages: [],
                    })
                    expect((result as any).invalidCode).toBeUndefined()
                    expect((result as any).extraDisplayFlag).toBeUndefined()
                    expect((result as any).customProperty).toBeUndefined()
                })
            })

            describe('OptionSetMetadataItem property handling', () => {
                it('should include all valid OptionSet properties and strip unknown ones', () => {
                    const input = {
                        id: 'optset1',
                        name: 'Test Option Set',
                        options: [{ id: 'opt1', name: 'Option 1' }],
                        customField: 'should be stripped',
                        extraArray: [1, 2, 3],
                        invalidObject: { test: 'value' },
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'optset1',
                        name: 'Test Option Set',
                        attributeValues: [],
                        options: [{ id: 'opt1', name: 'Option 1' }],
                        sharing: {},
                        translations: [],
                    })
                    expect((result as any).customField).toBeUndefined()
                    expect((result as any).extraArray).toBeUndefined()
                    expect((result as any).invalidObject).toBeUndefined()
                })

                it('should handle undefined optional OptionSet properties', () => {
                    const input = {
                        id: 'optset1',
                        name: 'Test Option Set',
                        options: [{ id: 'opt1', name: 'Option 1' }],
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'optset1',
                        name: 'Test Option Set',
                        attributeValues: [],
                        options: [{ id: 'opt1', name: 'Option 1' }],
                        sharing: {},
                        translations: [],
                    })
                    expect((result as any).code).toBeUndefined()
                    expect((result as any).description).toBeUndefined()
                    expect((result as any).created).toBeUndefined()
                    expect((result as any).lastUpdated).toBeUndefined()
                    expect((result as any).valueType).toBeUndefined()
                })
            })

            describe('SimpleMetadataItem property handling', () => {
                it('should only preserve id and name from SimpleMetadataItem', () => {
                    // SimpleMetadataItem must be a single key-value pair to be detected correctly
                    const input = { TODAY: 'Today' }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'TODAY',
                        name: 'Today',
                    })
                })

                it('should handle special characters in key-value pairs', () => {
                    const input = {
                        'SPECIAL_KEY-WITH.CHARS': 'Special Value with Spaces',
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'SPECIAL_KEY-WITH.CHARS',
                        name: 'Special Value with Spaces',
                    })
                })
            })
        })

        describe('Edge cases and boundary conditions', () => {
            describe('Empty and null value handling', () => {
                it('should handle MetadataItem with empty string values', () => {
                    const input = {
                        uid: 'test-uid',
                        name: '', // Empty name should make it NOT a MetadataItem
                        code: '',
                        description: '',
                    }
                    // This should throw because empty name makes it invalid MetadataItem
                    expect(() =>
                        normalizeMetadataInputItem(input as any)
                    ).toThrow('Unknown metadata input type')
                })

                it('should handle MetadataItem with null values', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        code: null,
                        description: null,
                        style: null,
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        code: null,
                        description: null,
                        style: null,
                        options: [],
                    })
                })

                it('should handle empty arrays and objects in MetadataItem', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        options: [],
                        style: {},
                        indicatorType: {},
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        options: [],
                        style: {},
                        indicatorType: {},
                    })
                })
            })

            describe('Complex nested data handling', () => {
                it('should preserve complex nested structures in MetadataItem', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        style: {
                            color: 'red',
                            backgroundColor: 'blue',
                            nested: {
                                deep: {
                                    property: 'value',
                                },
                            },
                        },
                        options: [
                            {
                                id: 'opt1',
                                name: 'Option 1',
                                metadata: {
                                    key: 'value',
                                    nested: { prop: 'test' },
                                },
                            },
                        ],
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        style: {
                            color: 'red',
                            backgroundColor: 'blue',
                            nested: {
                                deep: {
                                    property: 'value',
                                },
                            },
                        },
                        options: [
                            {
                                id: 'opt1',
                                name: 'Option 1',
                                metadata: {
                                    key: 'value',
                                    nested: { prop: 'test' },
                                },
                            },
                        ],
                    })
                })

                it('should handle complex ProgramMetadataItem with nested programStages', () => {
                    const input = {
                        id: 'prog1',
                        programType: 'WITH_REGISTRATION' as const,
                        name: 'Complex Program',
                        programStages: [
                            {
                                id: 'stage1',
                                repeatable: false,
                                name: 'Registration Stage',
                                metadata: { order: 1, required: true },
                            },
                            {
                                id: 'stage2',
                                repeatable: true,
                                name: 'Follow-up Stage',
                                nested: {
                                    configuration: {
                                        autoGenerate: true,
                                        validations: [
                                            'validation1',
                                            'validation2',
                                        ],
                                    },
                                },
                            },
                        ],
                        extraComplexProperty: { should: 'be stripped' },
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'prog1',
                        programType: 'WITH_REGISTRATION',
                        name: 'Complex Program',
                        programStages: [
                            {
                                id: 'stage1',
                                repeatable: false,
                                name: 'Registration Stage',
                                metadata: { order: 1, required: true },
                            },
                            {
                                id: 'stage2',
                                repeatable: true,
                                name: 'Follow-up Stage',
                                nested: {
                                    configuration: {
                                        autoGenerate: true,
                                        validations: [
                                            'validation1',
                                            'validation2',
                                        ],
                                    },
                                },
                            },
                        ],
                    })
                    expect((result as any).extraComplexProperty).toBeUndefined()
                })
            })

            describe('Type coercion and validation', () => {
                it('should handle boolean values in MetadataItem', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        // These might come as strings from API
                        someFlag: true,
                        anotherFlag: false,
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    // Only defined properties should be included
                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        options: [],
                        style: {},
                    })
                    expect((result as any).someFlag).toBeUndefined()
                    expect((result as any).anotherFlag).toBeUndefined()
                })

                it('should handle numeric values in appropriate contexts', () => {
                    const input = {
                        uid: 'test-uid',
                        name: 'Test Item',
                        numericProperty: 42,
                        floatProperty: 3.14,
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: 'Test Item',
                        options: [],
                        style: {},
                    })
                    expect((result as any).numericProperty).toBeUndefined()
                    expect((result as any).floatProperty).toBeUndefined()
                })

                it('should handle empty uid gracefully', () => {
                    const input = {
                        uid: '', // Empty uid should make it NOT a MetadataItem
                        name: 'Test Item',
                        code: 'TEST',
                    }
                    // This should throw because empty uid makes it invalid MetadataItem
                    expect(() =>
                        normalizeMetadataInputItem(input as any)
                    ).toThrow('Unknown metadata input type')
                })
            })

            describe('Large and extreme data handling', () => {
                it('should handle MetadataItem with very long strings', () => {
                    const longString = 'A'.repeat(10000)
                    const input = {
                        uid: 'test-uid',
                        name: longString,
                        description: longString,
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'test-uid',
                        name: longString,
                        description: longString,
                        options: [],
                        style: {},
                    })
                })

                it('should handle OptionSetMetadataItem with large arrays', () => {
                    const largeOptionsArray = Array.from(
                        { length: 1000 },
                        (_, i) => ({
                            id: `opt${i}`,
                            name: `Option ${i}`,
                            value: `value${i}`,
                        })
                    )

                    const input = {
                        id: 'optset1',
                        name: 'Large Option Set',
                        options: largeOptionsArray,
                    }
                    const result = normalizeMetadataInputItem(input as any)

                    expect(result).toEqual({
                        id: 'optset1',
                        name: 'Large Option Set',
                        attributeValues: [],
                        options: largeOptionsArray,
                        sharing: {},
                        translations: [],
                    })
                    expect((result as any).options).toHaveLength(1000)
                })
            })
        })
    })
})
