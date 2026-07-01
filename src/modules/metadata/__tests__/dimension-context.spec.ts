import { extractDimensionContextFromCompoundId } from '@modules/metadata/dimension-context'
import type { MetadataMap } from '@types'
import { describe, it, expect } from 'vitest'

// Helpers to build a MetadataMap for extractDimensionContextFromCompoundId tests
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

describe('extractDimensionContextFromCompoundId', () => {
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
