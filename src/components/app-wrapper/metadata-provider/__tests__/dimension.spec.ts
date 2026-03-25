import { describe, it, expect } from 'vitest'
import {
    isCompoundDimensionId,
    parseCompoundDimensionId,
    extractDimensionContextFromCompoundId,
    resolveId,
} from '../dimension'
import type { MetadataMap } from '@types'

describe('parseCompoundDimensionId', () => {
    describe('valid inputs', () => {
        it('parses a single dimension ID', () => {
            const result = parseCompoundDimensionId('dimensionId')
            expect(result).toEqual({
                ids: ['dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId.dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program ID, stage ID, and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programId.stageId.dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID with repetition index and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 0,
            })
        })

        it('parses program/stage ID with different repetition index and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 1,
            })
        })

        it('parses program ID, stage ID with repetition index, and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programId.stageId[2].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: 2,
            })
        })

        it('parses multi-digit repetition index', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[123].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 123,
            })
        })
    })

    describe('invalid inputs', () => {
        it('throws error for empty string', () => {
            expect(() => parseCompoundDimensionId('')).toThrow(
                'Dimension ID input is not a populated string'
            )
        })

        it('throws error for only repetition index without dimension', () => {
            expect(() => parseCompoundDimensionId('[1]')).toThrow(
                'No valid dimension ID found in "[1]"'
            )
        })

        it('throws error for empty dimension after dot', () => {
            expect(() => parseCompoundDimensionId('programId.')).toThrow(
                'No valid dimension ID found in "programId."'
            )
        })

        it('throws error for empty dimension with repetition index', () => {
            expect(() => parseCompoundDimensionId('programId.[0]')).toThrow(
                'No valid dimension ID found in "programId.[0]"'
            )
        })

        it('throws error for double dots', () => {
            expect(() =>
                parseCompoundDimensionId('programId..dimensionId')
            ).toThrow(
                'Invalid dimension ID format: empty ID found in "programId..dimensionId"'
            )
        })

        it('throws error for leading dot', () => {
            expect(() => parseCompoundDimensionId('.dimensionId')).toThrow(
                'Invalid dimension ID format: empty ID found in ".dimensionId"'
            )
        })

        it('throws error for more than 3 IDs', () => {
            expect(() => parseCompoundDimensionId('a.b.c.d')).toThrow(
                'Invalid dimension ID format: expected at most 3 IDs, got 4'
            )
        })
    })

    describe('repetition index values', () => {
        it('handles repetition index of zero', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result.repetitionIndex).toBe(0)
        })

        it('handles negative repetition index', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[-1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: -1,
            })
        })

        it('extracts repetition index from anywhere in the string', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 0,
            })
        })
    })
})

describe('isCompoundDimensionId', () => {
    it('returns true for a dotted string', () => {
        expect(isCompoundDimensionId('stage.dimension')).toBe(true)
    })

    it('returns true for a three-part compound key', () => {
        expect(isCompoundDimensionId('program.stage.dimension')).toBe(true)
    })

    it('returns false for a plain string without dots', () => {
        expect(isCompoundDimensionId('dimensionId')).toBe(false)
    })

    it('returns false for an empty string', () => {
        expect(isCompoundDimensionId('')).toBe(false)
    })

    it('returns false for null', () => {
        expect(isCompoundDimensionId(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(isCompoundDimensionId(undefined)).toBe(false)
    })

    it('returns false for a number', () => {
        expect(isCompoundDimensionId(42)).toBe(false)
    })
})

// Helpers to build a MetadataMap for compoundIdToIdentifier tests
const programItem = {
    id: 'p1',
    name: 'Program 1',
    programType: 'WITH_REGISTRATION' as const,
    programStages: [
        { id: 'ps1', name: 'Stage 1', repeatable: false, hideDueDate: false },
    ],
}

const programWithMultipleStages = {
    id: 'p2',
    name: 'Program 2',
    programType: 'WITH_REGISTRATION' as const,
    programStages: [
        { id: 'ps2a', name: 'Stage A', repeatable: false, hideDueDate: false },
        { id: 'ps2b', name: 'Stage B', repeatable: false, hideDueDate: false },
    ],
}

const stageItem = {
    id: 'ps1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const makeMap = (
    items: Array<{ id: string } & Record<string, unknown>>
): MetadataMap =>
    new Map(
        items.map((item) => [
            item.id,
            item as Parameters<MetadataMap['set']>[1],
        ])
    )

describe('compoundIdToIdentifier', () => {
    it('resolves 3-part compound key directly without metadata lookup', () => {
        const map: MetadataMap = new Map()
        expect(
            extractDimensionContextFromCompoundId('p1.ps1.dim1', map)
        ).toEqual({
            dimensionId: 'dim1',
            programId: 'p1',
            programStageId: 'ps1',
        })
    })

    it('resolves 3-part key with repetition index', () => {
        const map: MetadataMap = new Map()
        expect(
            extractDimensionContextFromCompoundId('p1.ps1[2].dim1', map)
        ).toEqual({
            dimensionId: 'dim1',
            programId: 'p1',
            programStageId: 'ps1',
            repetitionIndex: 2,
        })
    })

    it('resolves 2-part key where first ID is a program stage in metadata', () => {
        const map = makeMap([stageItem])
        expect(extractDimensionContextFromCompoundId('ps1.dim1', map)).toEqual({
            dimensionId: 'dim1',
            programStageId: 'ps1',
            programId: 'p1',
        })
    })

    it('resolves 2-part key where first ID is a program with one stage (no stage inferred)', () => {
        const map = makeMap([programItem])
        expect(extractDimensionContextFromCompoundId('p1.dim1', map)).toEqual({
            dimensionId: 'dim1',
            programId: 'p1',
        })
    })

    it('resolves 2-part key where first ID is a program with multiple stages (no stage set)', () => {
        const map = makeMap([programWithMultipleStages])
        expect(extractDimensionContextFromCompoundId('p2.dim1', map)).toEqual({
            dimensionId: 'dim1',
            programId: 'p2',
        })
    })

    it('throws when 2-part key has unrecognised context ID', () => {
        const map: MetadataMap = new Map()
        expect(() =>
            extractDimensionContextFromCompoundId('unknownId.dim1', map)
        ).toThrow(
            'No context metadata found for dimension with compound ID "unknownId.dim1"'
        )
    })

    it('resolves 2-part key where first ID is a tracked entity type in metadata', () => {
        const map = makeMap([{ id: 'tet1', name: 'Person' }])
        expect(extractDimensionContextFromCompoundId('tet1.dim1', map)).toEqual(
            {
                dimensionId: 'dim1',
                trackedEntityTypeId: 'tet1',
            }
        )
    })

    it('resolves ou fixed dimension prefixed with a tracked entity type ID', () => {
        const map = makeMap([{ id: 'tet1', name: 'Person' }])
        expect(extractDimensionContextFromCompoundId('tet1.ou', map)).toEqual({
            dimensionId: 'ou',
            trackedEntityTypeId: 'tet1',
        })
    })

    it('resolves created fixed dimension prefixed with a tracked entity type ID', () => {
        const map = makeMap([{ id: 'tet1', name: 'Person' }])
        expect(
            extractDimensionContextFromCompoundId('tet1.created', map)
        ).toEqual({
            dimensionId: 'created',
            trackedEntityTypeId: 'tet1',
        })
    })

    it('throws when repetitionIndex is set but no programStageId is resolved', () => {
        // 2-part key with a program that has multiple stages — no stage resolved
        const map = makeMap([programWithMultipleStages])
        expect(() =>
            extractDimensionContextFromCompoundId('p2[0].dim1', map)
        ).toThrow(
            'Invalid combination: repetitionIndex "0" but no programStage'
        )
    })
})

describe('resolveId', () => {
    it('returns a plain key unchanged', () => {
        expect(resolveId('dimensionId')).toBe('dimensionId')
    })

    it('returns a 2-segment key unchanged (already canonical)', () => {
        expect(resolveId('stageId.dimId')).toBe('stageId.dimId')
    })

    it('drops the first segment of a 3-segment key', () => {
        expect(resolveId('programId.stageId.dimId')).toBe('stageId.dimId')
    })

    it('handles a 3-segment key with a repetition index on the stage segment', () => {
        // [n] contains no dots, so the segment count is still 3
        expect(resolveId('programId.stageId[0].dimId')).toBe('stageId[0].dimId')
    })

    it('handles a 2-segment key with a repetition index', () => {
        expect(resolveId('stageId[1].dimId')).toBe('stageId[1].dimId')
    })
})
