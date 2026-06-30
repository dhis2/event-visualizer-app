/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import { smartMergeWithChangeDetection } from '../merge-utils'

describe('smartMergeWithChangeDetection', () => {
    it('should return new item when no existing item', () => {
        const newItem = { id: '1', name: 'Test', displayName: 'Test Display' }
        const result = smartMergeWithChangeDetection(undefined, newItem as any)

        expect(result.hasChanges).toBe(true)
        expect(result.mergedItem).toBe(newItem)
    })

    it('should detect no changes when items are identical', () => {
        const existing = {
            id: '1',
            name: 'Test',
            displayName: 'Test Display',
            value: 42,
        }
        const newItem = {
            id: '1',
            name: 'Test',
            displayName: 'Test Display',
            value: 42,
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(false)
        expect(result.mergedItem).toEqual(existing)
    })

    it('should detect changes in primitive fields', () => {
        const existing = {
            id: '1',
            name: 'Test',
            displayName: 'Test Display',
            value: 42,
        }
        const newItem = {
            id: '1',
            name: 'Test',
            displayName: 'Updated Display',
            value: 42,
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(true)
        expect((result.mergedItem as any).displayName).toBe('Updated Display')
    })

    it('should preserve existing when new value is empty', () => {
        const existing = {
            id: '1',
            name: 'Test',
            displayName: 'Test Display',
            value: 42,
        }
        const newItem = { id: '1', name: 'Test', displayName: '', value: 42 }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(false)
        expect((result.mergedItem as any).displayName).toBe('Test Display')
    })

    it('should use new value when existing is empty', () => {
        const existing = { id: '1', name: 'Test', displayName: '', value: 42 }
        const newItem = {
            id: '1',
            name: 'Test',
            displayName: 'New Display',
            value: 42,
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(true)
        expect((result.mergedItem as any).displayName).toBe('New Display')
    })

    it('should handle arrays with deep equality', () => {
        const existing = {
            id: '1',
            name: 'Test',
            options: [{ name: 'A' }, { name: 'B' }],
        }
        const newItem = {
            id: '1',
            name: 'Test',
            options: [{ name: 'A' }, { name: 'B' }],
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(false)
        expect((result.mergedItem as any).options).toBe(existing.options) // Reference preserved
    })

    it('should detect changes in arrays', () => {
        const existing = {
            id: '1',
            name: 'Test',
            options: [{ name: 'A' }, { name: 'B' }],
        }
        const newItem = {
            id: '1',
            name: 'Test',
            options: [{ name: 'A' }, { name: 'C' }],
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(true)
        expect((result.mergedItem as any).options).toBe(newItem.options)
    })

    it('should handle objects with deep equality', () => {
        const existing = {
            id: '1',
            name: 'Test',
            sharing: { public: true, users: ['user1'] },
        }
        const newItem = {
            id: '1',
            name: 'Test',
            sharing: { public: true, users: ['user1'] },
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(false)
        expect((result.mergedItem as any).sharing).toBe(existing.sharing) // Reference preserved
    })

    it('should detect changes in objects', () => {
        const existing = {
            id: '1',
            name: 'Test',
            sharing: { public: true, users: ['user1'] },
        }
        const newItem = {
            id: '1',
            name: 'Test',
            sharing: { public: false, users: ['user1'] },
        }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(true)
        expect((result.mergedItem as any).sharing).toBe(newItem.sharing)
    })

    it('should handle mixed empty/populated scenarios', () => {
        const existing = { id: '1', name: 'Test', displayName: '', options: [] }
        const newItem = { id: '1', name: 'Test', displayName: '', options: [] }
        const result = smartMergeWithChangeDetection(
            existing as any,
            newItem as any
        )

        expect(result.hasChanges).toBe(false)
        expect((result.mergedItem as any).displayName).toBe(
            existing.displayName
        )
        expect((result.mergedItem as any).options).toBe(existing.options)
    })

    describe('Empty value handling', () => {
        it('should handle null values correctly', () => {
            const existing = { id: '1', name: 'Test', value: null }
            const newItem = { id: '1', name: 'Test', value: 'New Value' }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).value).toBe('New Value')
        })

        it('should preserve existing null when new is also null', () => {
            const existing = { id: '1', name: 'Test', value: null }
            const newItem = { id: '1', name: 'Test', value: null }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false)
            expect((result.mergedItem as any).value).toBe(null)
        })

        it('should handle undefined values correctly', () => {
            const existing = { id: '1', name: 'Test', value: undefined }
            const newItem = { id: '1', name: 'Test', value: 'New Value' }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).value).toBe('New Value')
        })

        it('should handle empty objects correctly', () => {
            const existing = { id: '1', name: 'Test', metadata: {} }
            const newItem = {
                id: '1',
                name: 'Test',
                metadata: { key: 'value' },
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).metadata).toEqual({
                key: 'value',
            })
        })

        it('should preserve existing when new is empty object', () => {
            const existing = {
                id: '1',
                name: 'Test',
                metadata: { key: 'value' },
            }
            const newItem = { id: '1', name: 'Test', metadata: {} }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false)
            expect((result.mergedItem as any).metadata).toEqual({
                key: 'value',
            })
        })

        it('should preserve existing reference when both are empty objects', () => {
            const existing = { id: '1', name: 'Test', metadata: {} }
            const newItem = { id: '1', name: 'Test', metadata: {} }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false)
            expect((result.mergedItem as any).metadata).toBe(existing.metadata)
        })
    })

    describe('Property addition and removal', () => {
        it('should add new properties from new item', () => {
            const existing = { id: '1', name: 'Test' }
            const newItem = {
                id: '1',
                name: 'Test',
                code: 'TEST',
                description: 'Test desc',
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).code).toBe('TEST')
            expect((result.mergedItem as any).description).toBe('Test desc')
        })

        it('should preserve existing properties not in new item', () => {
            const existing = {
                id: '1',
                name: 'Test',
                code: 'EXISTING',
                metadata: { old: 'value' },
            }
            const newItem = { id: '1', name: 'Test', description: 'New desc' }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).code).toBe('EXISTING') // Preserved
            expect((result.mergedItem as any).metadata).toEqual({
                old: 'value',
            }) // Preserved
            expect((result.mergedItem as any).description).toBe('New desc') // Added
        })
    })

    describe('Complex nested structures', () => {
        it('should handle deeply nested objects', () => {
            const existing = {
                id: '1',
                name: 'Test',
                config: {
                    settings: {
                        advanced: { option1: true, option2: false },
                    },
                },
            }
            const newItem = {
                id: '1',
                name: 'Test',
                config: {
                    settings: {
                        advanced: { option1: true, option2: false },
                    },
                },
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false)
            expect((result.mergedItem as any).config).toBe(existing.config) // Reference preserved
        })

        it('should detect changes in deeply nested objects', () => {
            const existing = {
                id: '1',
                name: 'Test',
                config: {
                    settings: {
                        advanced: { option1: true, option2: false },
                    },
                },
            }
            const newItem = {
                id: '1',
                name: 'Test',
                config: {
                    settings: {
                        advanced: { option1: true, option2: true }, // Changed option2
                    },
                },
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).config).toBe(newItem.config)
        })

        it('should handle arrays of objects', () => {
            const existing = {
                id: '1',
                name: 'Test',
                items: [
                    { id: 'a', value: 1 },
                    { id: 'b', value: 2 },
                ],
            }
            const newItem = {
                id: '1',
                name: 'Test',
                items: [
                    { id: 'a', value: 1 },
                    { id: 'b', value: 2 },
                ],
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false)
            expect((result.mergedItem as any).items).toBe(existing.items) // Reference preserved
        })

        it('should detect array order changes', () => {
            const existing = {
                id: '1',
                name: 'Test',
                items: [
                    { id: 'a', value: 1 },
                    { id: 'b', value: 2 },
                ],
            }
            const newItem = {
                id: '1',
                name: 'Test',
                items: [
                    { id: 'b', value: 2 },
                    { id: 'a', value: 1 },
                ],
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).items).toBe(newItem.items)
        })
    })

    describe('Edge cases', () => {
        it('should handle boolean false vs empty string', () => {
            const existing = { id: '1', name: 'Test', flag: false }
            const newItem = { id: '1', name: 'Test', flag: '' }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false) // Empty string should be ignored, keep false
            expect((result.mergedItem as any).flag).toBe(false)
        })

        it('should handle number 0 vs empty values', () => {
            const existing = { id: '1', name: 'Test', count: 0 }
            const newItem = { id: '1', name: 'Test', count: null }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false) // null should be ignored, keep 0
            expect((result.mergedItem as any).count).toBe(0)
        })

        it('should handle mixed primitive types', () => {
            const existing = { id: '1', name: 'Test', value: '42' }
            const newItem = { id: '1', name: 'Test', value: 42 }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).value).toBe(42)
        })

        it('should handle Date objects', () => {
            const date1 = new Date('2023-01-01')
            const date2 = new Date('2023-01-01')
            const existing = { id: '1', name: 'Test', created: date1 }
            const newItem = { id: '1', name: 'Test', created: date2 }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(false) // Same date values should be equal
            expect((result.mergedItem as any).created).toBe(date1) // Reference preserved
        })

        it('should handle completely different object structures', () => {
            const existing = {
                id: '1',
                name: 'Test',
                oldStructure: { a: 1, b: 2 },
            }
            const newItem = {
                id: '1',
                name: 'Test',
                newStructure: { x: 'a', y: 'b' },
            }
            const result = smartMergeWithChangeDetection(
                existing as any,
                newItem as any
            )

            expect(result.hasChanges).toBe(true)
            expect((result.mergedItem as any).oldStructure).toEqual({
                a: 1,
                b: 2,
            }) // Preserved
            expect((result.mergedItem as any).newStructure).toEqual({
                x: 'a',
                y: 'b',
            }) // Added
        })
    })
})
