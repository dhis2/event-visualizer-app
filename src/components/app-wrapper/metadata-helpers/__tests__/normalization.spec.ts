import { describe, it, expect } from 'vitest'
import { normalizeMetadataInputItem } from '../normalization'
import type { MetadataItem, MetadataInputItem } from '../types'

describe('normalizeMetadataInputItem', () => {
    const mockMetadataMap = new Map<string, MetadataItem>([
        [
            'existing-item',
            {
                id: 'existing-item',
                name: 'Existing Item',
                path: 'a-path-to-make-this-classify-as-a-valid-dimension-item',
            },
        ],
    ])

    describe('string input with key', () => {
        it('creates normalized item with id=key and name=value', () => {
            const result = normalizeMetadataInputItem(
                'Test Name',
                mockMetadataMap,
                'test-key'
            )

            expect(result).toEqual({
                id: 'test-key',
                name: 'Test Name',
            })
        })

        it('throws error for string without key', () => {
            expect(() => {
                normalizeMetadataInputItem('Test Name', mockMetadataMap)
            }).toThrow('Invalid metadata input: string value without a key')
        })
    })

    describe('object input with id resolution', () => {
        it('uses provided key over uid over id', () => {
            const input = {
                id: 'id-value',
                uid: 'uid-value',
                name: 'Test Name',
            } as unknown as MetadataInputItem // Cast for testing purposes

            const result = normalizeMetadataInputItem(
                input,
                mockMetadataMap,
                'key-value'
            )

            expect(result.id).toBe('key-value')
        })

        it('uses uid when no key provided', () => {
            const input: MetadataInputItem = {
                uid: 'uid-value',
                name: 'Test Name',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result.id).toBe('uid-value')
        })

        it('uses id when no key or uid provided', () => {
            const input: MetadataInputItem = {
                id: 'id-value',
                name: 'Test Name',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result.id).toBe('id-value')
        })

        it('throws error when no valid id found', () => {
            const input = {
                name: 'Test Name',
            } as unknown as MetadataInputItem // Cast for testing invalid input

            expect(() => {
                normalizeMetadataInputItem(input, mockMetadataMap)
            }).toThrow('Invalid metadata input: no ID field present')
        })
    })

    describe('name resolution', () => {
        it('uses displayName over name', () => {
            const input: MetadataInputItem = {
                id: 'test-id',
                name: 'Name',
                displayName: 'Display Name',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result.name).toBe('Display Name')
        })

        it('uses displayName when name not provided', () => {
            const input: MetadataInputItem = {
                id: 'test-id',
                displayName: 'Display Name',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result.name).toBe('Display Name')
        })
    })

    describe('with valid name', () => {
        it('includes name and preserves extra properties', () => {
            const input: MetadataInputItem = {
                id: 'test-id',
                name: 'Test Name',
                extraProp: 'extra value',
                anotherProp: 123,
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'test-id',
                name: 'Test Name',
                extraProp: 'extra value',
                anotherProp: 123,
            })
        })
    })

    describe('without valid name', () => {
        it('allows items that exist in metadata map', () => {
            const input: MetadataInputItem = {
                uid: 'existing-item',
                extraProp: 'updated value',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'existing-item',
                extraProp: 'updated value',
            })
        })

        it('allows optionSet items without name', () => {
            const input: MetadataInputItem = {
                id: 'option-set-id',
                options: [{ id: 'opt1', name: 'Option 1' }],
                extraProp: 'value',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'option-set-id',
                options: [{ id: 'opt1', name: 'Option 1' }],
                extraProp: 'value',
            })
        })

        it('allows legendSet items without name', () => {
            const input: MetadataInputItem = {
                id: 'legend-set-id',
                legends: [{ id: 'leg1', name: 'Legend 1' }],
                extraProp: 'value',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'legend-set-id',
                legends: [{ id: 'leg1', name: 'Legend 1' }],
                extraProp: 'value',
            })
        })

        it('throws error for new items without name', () => {
            const input: MetadataInputItem = {
                id: 'new-item-id',
                extraProp: 'value',
            }

            expect(() => {
                normalizeMetadataInputItem(input, mockMetadataMap)
            }).toThrow('Invalid metadata input: expected name field not found')
        })
    })
})
