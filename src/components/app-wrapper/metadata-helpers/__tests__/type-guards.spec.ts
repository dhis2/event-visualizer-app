/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import {
    isObject,
    isSingleMetadataItemInput,
    isMetadataItem,
    isSimpleMetadataItem,
    isProgramMetadataItem,
    isOptionSetMetadataItem,
} from '../type-guards'

describe('type-guards', () => {
    describe('isObject', () => {
        it('should return true for plain objects', () => {
            expect(isObject({})).toBe(true)
            expect(isObject({ key: 'value' })).toBe(true)
            expect(isObject({ id: '1', name: 'test' })).toBe(true)
            expect(isObject({ nested: { value: 1 } })).toBe(true)
        })

        it('should return false for non-objects', () => {
            expect(isObject(null)).toBe(false)
            expect(isObject(undefined)).toBe(false)
            expect(isObject('string')).toBe(false)
            expect(isObject(123)).toBe(false)
            expect(isObject(0)).toBe(false)
            expect(isObject(true)).toBe(false)
            expect(isObject(false)).toBe(false)
            expect(isObject([])).toBe(false)
            expect(isObject([1, 2, 3])).toBe(false)
            expect(isObject(['string'])).toBe(false)
        })

        it('should return false for special object types', () => {
            expect(isObject(new Date())).toBe(true) // Date objects are still objects
            expect(isObject(/regex/)).toBe(true) // RegExp objects are still objects
            expect(isObject(new Error())).toBe(true) // Error objects are still objects
            expect(isObject(() => {})).toBe(false) // Functions are not objects for our purposes
        })

        it('should handle edge cases', () => {
            expect(isObject(Object.create(null))).toBe(true)
            expect(isObject(Object.prototype)).toBe(true)
            expect(isObject(Symbol('test'))).toBe(false)
            expect(isObject(BigInt(123))).toBe(false)
        })
    })

    describe('isSingleMetadataItemInput', () => {
        it('should return true for valid MetadataItem objects', () => {
            expect(
                isSingleMetadataItemInput({ uid: 'test', name: 'Test' })
            ).toBe(true)
            expect(
                isSingleMetadataItemInput({
                    uid: 'test123',
                    name: 'Test Name',
                    displayName: 'Display Test',
                    code: 'CODE',
                })
            ).toBe(true)
        })

        it('should return true for valid SimpleMetadataItem objects', () => {
            expect(isSingleMetadataItemInput({ key: 'value' })).toBe(true)
            expect(isSingleMetadataItemInput({ user: 'admin' })).toBe(true)
            expect(isSingleMetadataItemInput({ period: '2023' })).toBe(true)
        })

        it('should return true for valid ProgramMetadataItem objects', () => {
            expect(
                isSingleMetadataItemInput({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                    name: 'Test Program',
                })
            ).toBe(true)
            expect(
                isSingleMetadataItemInput({
                    id: 'prog456',
                    programType: 'WITHOUT_REGISTRATION',
                    name: 'Another Program',
                    displayIncidentDate: true,
                })
            ).toBe(true)
        })

        it('should return true for valid OptionSetMetadataItem objects', () => {
            expect(
                isSingleMetadataItemInput({
                    id: 'opt123',
                    name: 'Test Option Set',
                    options: [{ id: 'opt1', name: 'Option 1' }],
                })
            ).toBe(true)
            expect(
                isSingleMetadataItemInput({
                    id: 'opt456',
                    name: 'Another Option Set',
                    options: [],
                    valueType: 'TEXT',
                })
            ).toBe(true)
        })

        it('should return false for objects that do not match any metadata item type', () => {
            expect(
                isSingleMetadataItemInput({ name: 'test', extra: 'field' })
            ).toBe(false) // multiple fields, not SimpleMetadataItem
            expect(isSingleMetadataItemInput({})).toBe(false) // empty object
            expect(
                isSingleMetadataItemInput({ displayName: 'test', code: 'test' })
            ).toBe(false) // multiple fields
            expect(isSingleMetadataItemInput({ id: 123 })).toBe(false) // id is not a string
            expect(isSingleMetadataItemInput({ uid: null })).toBe(false) // uid is not a string
        })

        it('should return false for Record<string, AnyMetadataItemInput> objects', () => {
            // These are records of metadata items, not single metadata items
            expect(
                isSingleMetadataItemInput({
                    item1: { uid: 'test1', name: 'Test 1' },
                    item2: { uid: 'test2', name: 'Test 2' },
                })
            ).toBe(false)
            expect(
                isSingleMetadataItemInput({
                    key1: { key: 'value1' },
                    key2: { key: 'value2' },
                })
            ).toBe(false)
        })

        it('should return false for invalid metadata items with empty strings', () => {
            expect(isSingleMetadataItemInput({ uid: '', name: 'Test' })).toBe(
                false
            )
            expect(isSingleMetadataItemInput({ uid: 'test', name: '' })).toBe(
                false
            )
            expect(isSingleMetadataItemInput({ key: '' })).toBe(false)
            expect(isSingleMetadataItemInput({ '': 'value' })).toBe(false)
        })

        it('should return false for non-objects', () => {
            expect(isSingleMetadataItemInput(null)).toBe(false)
            expect(isSingleMetadataItemInput(undefined)).toBe(false)
            expect(isSingleMetadataItemInput('string')).toBe(false)
            expect(isSingleMetadataItemInput(123)).toBe(false)
            expect(isSingleMetadataItemInput([])).toBe(false)
            expect(isSingleMetadataItemInput(['id'])).toBe(false)
            expect(isSingleMetadataItemInput(true)).toBe(false)
        })
    })

    describe('isMetadataItem', () => {
        it('should return true for objects with both uid and name strings', () => {
            expect(isMetadataItem({ uid: 'test123', name: 'Test Name' })).toBe(
                true
            )
            expect(isMetadataItem({ uid: 'abc', name: 'ABC Name' })).toBe(true)
            expect(
                isMetadataItem({
                    uid: 'abc123',
                    name: 'Test',
                    displayName: 'Display Test',
                    code: 'CODE',
                })
            ).toBe(true)
        })

        it('should return false for objects missing uid', () => {
            expect(isMetadataItem({ name: 'Test Name' })).toBe(false)
            expect(isMetadataItem({ id: 'test', name: 'Test Name' })).toBe(
                false
            )
            expect(isMetadataItem({ name: 'test', other: 'prop' })).toBe(false)
            expect(isMetadataItem({})).toBe(false)
        })

        it('should return false for objects missing name', () => {
            expect(isMetadataItem({ uid: 'test123' })).toBe(false)
            expect(isMetadataItem({ uid: 'test', id: 'different' })).toBe(false)
            expect(isMetadataItem({ uid: 'test', other: 'prop' })).toBe(false)
        })

        it('should return false for objects with non-string uid', () => {
            expect(isMetadataItem({ uid: 123, name: 'Test Name' } as any)).toBe(
                false
            )
            expect(
                isMetadataItem({ uid: null, name: 'Test Name' } as any)
            ).toBe(false)
            expect(
                isMetadataItem({ uid: undefined, name: 'Test Name' } as any)
            ).toBe(false)
            expect(
                isMetadataItem({ uid: true, name: 'Test Name' } as any)
            ).toBe(false)
            expect(isMetadataItem({ uid: [], name: 'Test Name' } as any)).toBe(
                false
            )
            expect(isMetadataItem({ uid: {}, name: 'Test Name' } as any)).toBe(
                false
            )
        })

        it('should return false for objects with non-string name', () => {
            expect(isMetadataItem({ uid: 'test123', name: 123 } as any)).toBe(
                false
            )
            expect(isMetadataItem({ uid: 'test123', name: null } as any)).toBe(
                false
            )
            expect(
                isMetadataItem({ uid: 'test123', name: undefined } as any)
            ).toBe(false)
            expect(isMetadataItem({ uid: 'test123', name: true } as any)).toBe(
                false
            )
            expect(isMetadataItem({ uid: 'test123', name: [] } as any)).toBe(
                false
            )
            expect(isMetadataItem({ uid: 'test123', name: {} } as any)).toBe(
                false
            )
        })

        it('should return false for empty strings', () => {
            expect(isMetadataItem({ uid: '', name: 'Test Name' })).toBe(false)
            expect(isMetadataItem({ uid: 'test123', name: '' })).toBe(false)
            expect(isMetadataItem({ uid: '', name: '' })).toBe(false)
        })

        it('should handle edge cases with additional properties', () => {
            expect(
                isMetadataItem({
                    uid: 'test',
                    name: 'Test Name',
                    id: 'different',
                })
            ).toBe(true)
            expect(
                isMetadataItem({
                    uid: 'test',
                    name: 'Test Name',
                    extra: 'prop',
                })
            ).toBe(true)
        })
    })

    describe('isSimpleMetadataItem', () => {
        it('should return true for objects with exactly one string key-value pair', () => {
            expect(isSimpleMetadataItem({ key: 'value' })).toBe(true)
            expect(isSimpleMetadataItem({ user: 'admin' })).toBe(true)
            expect(isSimpleMetadataItem({ period: '2023' })).toBe(true)
            expect(isSimpleMetadataItem({ orgUnit: 'OU123' })).toBe(true)
        })

        it('should return false for objects with empty strings', () => {
            expect(isSimpleMetadataItem({ '': '' })).toBe(false) // empty strings are now rejected
            expect(isSimpleMetadataItem({ key: '' })).toBe(false)
            expect(isSimpleMetadataItem({ '': 'value' })).toBe(false)
        })

        it('should return false for objects with multiple properties', () => {
            expect(
                isSimpleMetadataItem({ key1: 'value1', key2: 'value2' })
            ).toBe(false)
            expect(isSimpleMetadataItem({ id: 'test', name: 'Test' })).toBe(
                false
            )
            expect(
                isSimpleMetadataItem({
                    uid: 'test',
                    name: 'Test',
                    displayName: 'Display',
                })
            ).toBe(false)
        })

        it('should return false for empty objects', () => {
            expect(isSimpleMetadataItem({})).toBe(false)
        })

        it('should return false for objects with non-string values', () => {
            expect(isSimpleMetadataItem({ key: 123 } as any)).toBe(false)
            expect(isSimpleMetadataItem({ key: null } as any)).toBe(false)
            expect(isSimpleMetadataItem({ key: undefined } as any)).toBe(false)
            expect(isSimpleMetadataItem({ key: true } as any)).toBe(false)
            expect(isSimpleMetadataItem({ key: [] } as any)).toBe(false)
            expect(isSimpleMetadataItem({ key: {} } as any)).toBe(false)
        })

        it('should return false for objects with non-string keys', () => {
            // Note: In JavaScript, object keys are always strings, but we can test symbols
            const objWithSymbol = Object.create(null)
            Object.defineProperty(objWithSymbol, Symbol('test'), {
                value: 'value',
                enumerable: true,
            })
            expect(isSimpleMetadataItem(objWithSymbol)).toBe(false) // Symbol keys won't appear in Object.entries
        })

        it('should return false for non-objects', () => {
            expect(isSimpleMetadataItem(null as any)).toBe(false)
            expect(isSimpleMetadataItem(undefined as any)).toBe(false)
            expect(isSimpleMetadataItem('string' as any)).toBe(false)
            expect(isSimpleMetadataItem(123 as any)).toBe(false)
            expect(isSimpleMetadataItem([] as any)).toBe(false)
        })

        it('should handle edge cases', () => {
            // Test with special characters in keys/values
            expect(
                isSimpleMetadataItem({ 'special-key': 'special-value' })
            ).toBe(true)
            expect(
                isSimpleMetadataItem({ 'key with spaces': 'value with spaces' })
            ).toBe(true)
            expect(isSimpleMetadataItem({ '🔑': '💰' })).toBe(true)
        })
    })

    describe('isProgramMetadataItem', () => {
        const validProgram = {
            id: 'prog123',
            programType: 'WITH_REGISTRATION' as any,
            name: 'Test Program',
        }

        it('should return true for valid program metadata items', () => {
            expect(isProgramMetadataItem(validProgram)).toBe(true)
            expect(
                isProgramMetadataItem({
                    id: 'prog456',
                    programType: 'WITHOUT_REGISTRATION' as any,
                    name: 'Another Program',
                })
            ).toBe(true)
        })

        it('should return true for programs with optional properties', () => {
            expect(
                isProgramMetadataItem({
                    ...validProgram,
                    displayIncidentDate: true,
                    code: 'PROG_CODE',
                })
            ).toBe(true)

            expect(
                isProgramMetadataItem({
                    ...validProgram,
                    programStages: [
                        { id: 'stage1', repeatable: false, name: 'Stage 1' },
                        { id: 'stage2', repeatable: true, name: 'Stage 2' },
                    ],
                })
            ).toBe(true)

            expect(
                isProgramMetadataItem({
                    ...validProgram,
                    displayIncidentDate: false,
                    programStages: [],
                    code: '',
                    extraProperty: 'should still work',
                } as any)
            ).toBe(true)
        })

        it('should return false for objects missing required properties', () => {
            expect(
                isProgramMetadataItem({
                    programType: 'WITH_REGISTRATION',
                    name: 'Test',
                } as any)
            ).toBe(false) // missing id
            expect(
                isProgramMetadataItem({ id: 'prog123', name: 'Test' } as any)
            ).toBe(false) // missing programType
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                } as any)
            ).toBe(false) // missing name
        })

        it('should return false for objects with invalid property types', () => {
            expect(
                isProgramMetadataItem({
                    id: 123, // should be string
                    programType: 'WITH_REGISTRATION',
                    name: 'Test',
                } as any)
            ).toBe(false)

            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                    name: 123, // should be string
                } as any)
            ).toBe(false)

            expect(
                isProgramMetadataItem({
                    id: null,
                    programType: 'WITH_REGISTRATION',
                    name: 'Test',
                } as any)
            ).toBe(false)

            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                    name: null,
                } as any)
            ).toBe(false)
        })

        it('should return false for non-objects', () => {
            expect(isProgramMetadataItem(null as any)).toBe(false)
            expect(isProgramMetadataItem(undefined as any)).toBe(false)
            expect(isProgramMetadataItem('string' as any)).toBe(false)
            expect(isProgramMetadataItem(123 as any)).toBe(false)
            expect(isProgramMetadataItem([] as any)).toBe(false)
        })

        it('should return false for empty strings', () => {
            expect(
                isProgramMetadataItem({
                    id: '',
                    programType: 'WITH_REGISTRATION',
                    name: 'Test',
                })
            ).toBe(false)
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: '',
                    name: 'Test',
                })
            ).toBe(false)
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                    name: '',
                })
            ).toBe(false)
        })

        it('should handle edge cases', () => {
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'INVALID_TYPE' as any, // invalid enum value but still string
                    name: 'Test',
                } as any)
            ).toBe(true) // we only check type, not enum values
        })
    })

    describe('isOptionSetMetadataItem', () => {
        const validOptionSet = {
            id: 'opt123',
            name: 'Test Option Set',
            options: [
                { id: 'opt1', name: 'Option 1' },
                { id: 'opt2', name: 'Option 2' },
            ],
            valueType: 'TEXT' as any,
            version: 1,
        }

        it('should return true for valid option set metadata items', () => {
            expect(isOptionSetMetadataItem(validOptionSet as any)).toBe(true)
            expect(
                isOptionSetMetadataItem({
                    id: 'opt456',
                    name: 'Another Option Set',
                    options: [],
                    valueType: 'TEXT' as any,
                    version: 1,
                } as any)
            ).toBe(true) // empty options array is still valid
        })

        it('should return true for option sets with additional properties', () => {
            expect(
                isOptionSetMetadataItem({
                    ...validOptionSet,
                    code: 'OPT_CODE',
                    displayName: 'Display Name',
                } as any)
            ).toBe(true)
        })

        it('should return false for objects missing required properties', () => {
            expect(
                isOptionSetMetadataItem({
                    name: 'Test',
                    options: [],
                } as any)
            ).toBe(false) // missing id

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    options: [],
                } as any)
            ).toBe(false) // missing name

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test',
                } as any)
            ).toBe(false) // missing options
        })

        it('should return false for objects with invalid property types', () => {
            expect(
                isOptionSetMetadataItem({
                    id: 123, // should be string
                    name: 'Test',
                    options: [],
                } as any)
            ).toBe(false)

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 123, // should be string
                    options: [],
                } as any)
            ).toBe(false)

            expect(
                isOptionSetMetadataItem({
                    id: null,
                    name: 'Test',
                    options: [],
                } as any)
            ).toBe(false)

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: null,
                    options: [],
                } as any)
            ).toBe(false)
        })

        it('should return true regardless of options property type', () => {
            // The function only checks for presence of options, not its type
            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test',
                    options: 'not an array',
                } as any)
            ).toBe(true)

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test',
                    options: null,
                } as any)
            ).toBe(true)

            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test',
                    options: 123,
                } as any)
            ).toBe(true)
        })

        it('should return false for non-objects', () => {
            expect(isOptionSetMetadataItem(null as any)).toBe(false)
            expect(isOptionSetMetadataItem(undefined as any)).toBe(false)
            expect(isOptionSetMetadataItem('string' as any)).toBe(false)
            expect(isOptionSetMetadataItem(123 as any)).toBe(false)
            expect(isOptionSetMetadataItem([] as any)).toBe(false)
        })

        it('should return false for empty strings', () => {
            expect(
                isOptionSetMetadataItem({
                    id: '',
                    name: 'Test',
                    options: [],
                } as any)
            ).toBe(false)
            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: '',
                    options: [],
                } as any)
            ).toBe(false)
        })

        it('should handle edge cases', () => {
            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test',
                    options: [],
                    uid: 'should not interfere',
                } as any)
            ).toBe(true) // additional properties should not interfere
        })
    })
})
