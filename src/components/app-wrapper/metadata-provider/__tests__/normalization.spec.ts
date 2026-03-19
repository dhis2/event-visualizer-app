import { describe, it, expect } from 'vitest'
import {
    getCanonicalKeysForInput,
    normalizeMetadataInputItem,
} from '../normalization'
import type { MetadataItem, MetadataInputItem } from '@types'

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
                name: 'Existing Item',
                extraProp: 'updated value',
            })
        })

        it('requires optionSet items to have name', () => {
            const input: MetadataInputItem = {
                id: 'option-set-id',
                name: 'Option Set',
                options: [{ id: 'opt1', name: 'Option 1' }],
                extraProp: 'value',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'option-set-id',
                name: 'Option Set',
                options: [{ id: 'opt1', name: 'Option 1' }],
                extraProp: 'value',
            })
        })

        it('requires legendSet items to have name', () => {
            const input: MetadataInputItem = {
                id: 'legend-set-id',
                name: 'Legend Set',
                legends: [{ id: 'leg1', name: 'Legend 1' }],
                extraProp: 'value',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'legend-set-id',
                name: 'Legend Set',
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
            }).toThrow('New metadata item "new-item-id" does not have a name')
        })
    })
})

describe('normalizeMetadataInputItem — dimensionId assignment', () => {
    const emptyMap = new Map<string, MetadataItem>()

    it('sets dimensionId to the plain id for a plain dimension item', () => {
        const input: MetadataInputItem = {
            id: 'eventDate',
            name: 'Event date',
            dimensionType: 'PERIOD',
        }

        const result = normalizeMetadataInputItem(input, emptyMap)

        expect(result).toMatchObject({
            id: 'eventDate',
            dimensionId: 'eventDate',
        })
    })

    it('sets dimensionId to the plain (last) part for a compound key stored under stageId.dimensionId', () => {
        const stageId = 'ps1'
        const dimId = 'myDimension'
        const stageMetadata: MetadataItem = {
            id: stageId,
            name: 'Stage 1',
            displayExecutionDateLabel: 'Report date',
            hideDueDate: false,
            repeatable: false,
            program: { id: 'p1' },
        }
        const mapWithStage = new Map<string, MetadataItem>([
            [stageId, stageMetadata],
        ])

        const input: MetadataInputItem = {
            id: `${stageId}.${dimId}`,
            name: 'My Dimension',
            dimensionType: 'DATA_ELEMENT',
        }

        const result = normalizeMetadataInputItem(input, mapWithStage)

        expect(result).toMatchObject({
            id: `${stageId}.${dimId}`,
            dimensionId: dimId,
            programStageId: stageId,
            programId: 'p1',
        })
    })

    it('keeps p1.dimId as program-canonical when program is an event program (1 stage)', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'height'
        const programMetadata: MetadataItem = {
            id: programId,
            name: 'My Event Program',
            programType: 'WITHOUT_REGISTRATION',
            programStages: [
                {
                    id: stageId,
                    name: 'Stage 1',
                    displayExecutionDateLabel: 'Report date',
                    hideDueDate: false,
                    repeatable: false,
                    program: { id: programId },
                },
            ],
        }
        const mapWithProgram = new Map<string, MetadataItem>([
            [programId, programMetadata],
        ])

        const input: MetadataInputItem = {
            id: `${programId}.${dimId}`,
            name: 'Height',
            dimensionType: 'DATA_ELEMENT',
        }

        const result = normalizeMetadataInputItem(input, mapWithProgram)

        // Canonical key is program-based — p1.dim stays as p1.dim (no auto-resolve to stage)
        expect(result.id).toBe(`${programId}.${dimId}`)
        expect(result).toMatchObject({
            dimensionId: dimId,
            programId,
        })
        expect(result).not.toHaveProperty('programStageId')
    })

    it('does not set dimensionId for a non-dimension plain item (e.g. period shortcut)', () => {
        // A plain item that is NOT a DimensionMetadataItem (no dimensionType)
        const input: MetadataInputItem = {
            id: 'TODAY',
            name: 'Today',
        }

        const result = normalizeMetadataInputItem(input, emptyMap)

        expect(result).toEqual({ id: 'TODAY', name: 'Today' })
        expect(result).not.toHaveProperty('dimensionId')
    })
})

describe('getCanonicalKeysForInput', () => {
    const emptyMap = new Map<string, MetadataItem>()

    it('returns the id of each normalizable input item', () => {
        const input = {
            key1: { id: 'key1', name: 'Item 1' },
            key2: { id: 'key2', name: 'Item 2' },
        }

        const result = getCanonicalKeysForInput(input, emptyMap)

        expect(result).toEqual(new Set(['key1', 'key2']))
    })

    it('falls back to the raw key when normalization fails (e.g. missing name)', () => {
        const input = {
            unknownKey: { id: 'unknownKey' },
        }

        const result = getCanonicalKeysForInput(input, emptyMap)

        // normalizeMetadataInputItem throws for items with no name and not in map,
        // so getCanonicalKeysForInput falls back to the raw key
        expect(result).toEqual(new Set(['unknownKey']))
    })

    it('returns program-based canonical key for a program-prefixed compound key', () => {
        const stageId = 'ps1'
        const dimId = 'weight'
        const stageMetadata: MetadataItem = {
            id: stageId,
            name: 'Stage 1',
            displayExecutionDateLabel: 'Report date',
            hideDueDate: false,
            repeatable: false,
            program: { id: 'p1' },
        }

        // Input uses programId.dimId — stays as programId.dimId (it IS canonical)
        const programMetadata: MetadataItem = {
            id: 'p1',
            name: 'My Program',
            programType: 'WITHOUT_REGISTRATION',
            programStages: [
                {
                    id: stageId,
                    name: 'Stage 1',
                    displayExecutionDateLabel: 'Report date',
                    hideDueDate: false,
                    repeatable: false,
                    program: { id: 'p1' },
                },
            ],
        }
        const mapWithBoth = new Map<string, MetadataItem>([
            ['p1', programMetadata],
            [stageId, stageMetadata],
        ])

        const input = {
            [`p1.${dimId}`]: {
                id: `p1.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        }

        const result = getCanonicalKeysForInput(input, mapWithBoth)

        // p1.dim stays as p1.dim — no auto-resolve to stage
        expect(result).toEqual(new Set([`p1.${dimId}`]))
    })

    it('returns an empty set for an empty input', () => {
        const result = getCanonicalKeysForInput({}, emptyMap)

        expect(result).toEqual(new Set())
    })

    it('handles a mix of plain and compound keys', () => {
        const stageId = 'ps1'
        const stageMetadata: MetadataItem = {
            id: stageId,
            name: 'Stage 1',
            displayExecutionDateLabel: 'Report date',
            hideDueDate: false,
            repeatable: false,
            program: { id: 'p1' },
        }
        const mapWithStage = new Map<string, MetadataItem>([
            [stageId, stageMetadata],
        ])

        const input = {
            plainKey: { id: 'plainKey', name: 'Plain' },
            [`${stageId}.dim1`]: {
                id: `${stageId}.dim1`,
                name: 'Dimension 1',
                dimensionType: 'DATA_ELEMENT',
            },
        }

        const result = getCanonicalKeysForInput(input, mapWithStage)

        expect(result).toEqual(new Set(['plainKey', `${stageId}.dim1`]))
    })
})
