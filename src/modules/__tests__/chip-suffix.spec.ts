import { describe, it, expect } from 'vitest'
import { getChipSuffixes, type SuffixInput } from '../chip-suffix.js'

const buildGetName = (
    names: Record<string, string>
): ((id: string) => string | undefined) => {
    return (id) => names[id]
}

describe('getChipSuffixes', () => {
    describe('spec example 1: single program, single stage', () => {
        it('returns no suffix for any stage-bound dim', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1s1.eventStatus',
                    dimensionType: 'STATUS',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1s1.ou',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p1s1: 'Stage 1' })
            )
            expect(result).toEqual({
                'p1s1.de1': undefined,
                'p1s1.eventStatus': undefined,
                'p1s1.ou': undefined,
            })
        })
    })

    describe('spec example 2: single program, single stage + program-bound dims', () => {
        it('returns no suffix for stage-bound or program-bound dims', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1.programStatus',
                    dimensionType: 'STATUS',
                    programId: 'p1',
                },
                {
                    id: 'p1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p1s1: 'Stage 1' })
            )
            expect(result).toEqual({
                'p1s1.de1': undefined,
                'p1.programStatus': undefined,
                'p1.enrollmentOu': undefined,
            })
        })
    })

    describe('spec example 3: single program, multiple stages', () => {
        it('returns the stage name as suffix on each stage-bound dim', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1s2.eventStatus',
                    dimensionType: 'STATUS',
                    programId: 'p1',
                    programStageId: 'p1s2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p1s1: 'Stage 1',
                    p1s2: 'Stage 2',
                })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Stage 1',
                'p1s2.eventStatus': 'Stage 2',
            })
        })
    })

    describe('spec example 4: single program, multiple stages + program-bound', () => {
        it('shows stage suffix on stage-bound, no suffix on program-bound', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1s2.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s2',
                },
                {
                    id: 'p1.programStatus',
                    dimensionType: 'STATUS',
                    programId: 'p1',
                },
                {
                    id: 'p1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p1s1: 'Stage 1',
                    p1s2: 'Stage 2',
                })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Stage 1',
                'p1s2.de2': 'Stage 2',
                'p1.programStatus': undefined,
                'p1.enrollmentOu': undefined,
            })
        })
    })

    describe('spec example 5: multiple programs, program-bound only', () => {
        it('shows program name suffix on each program-bound dim', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                },
                {
                    id: 'p2.programStatus',
                    dimensionType: 'STATUS',
                    programId: 'p2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p2: 'Program 2' })
            )
            expect(result).toEqual({
                'p1.enrollmentOu': 'Program 1',
                'p2.programStatus': 'Program 2',
            })
        })
    })

    describe('spec example 6: multiple programs, single stage + program-bound', () => {
        it('falls back to program suffix on the stage-bound dim', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    p1s1: 'Stage 1',
                })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Program 1',
                'p2.enrollmentOu': 'Program 2',
            })
        })
    })

    describe('spec example 7: multiple programs, multiple stages', () => {
        it('shows stage suffix on stage-bound and program suffix on program-bound', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2s5.eventStatus',
                    dimensionType: 'STATUS',
                    programId: 'p2',
                    programStageId: 'p2s5',
                },
                {
                    id: 'p3.enrollmentDate',
                    dimensionType: 'PERIOD',
                    programId: 'p3',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    p3: 'Program 3',
                    p1s1: 'Stage 1',
                    p2s5: 'Stage 5',
                })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Stage 1',
                'p2s5.eventStatus': 'Stage 5',
                'p3.enrollmentDate': 'Program 3',
            })
        })
    })

    describe('spec example 8: multiple programs, multiple stages, colliding stage names', () => {
        it('shows compound suffix only on colliding dims, plain stage suffix elsewhere', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2s1.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p2',
                    programStageId: 'p2s1',
                },
                {
                    id: 'p3s8.de3',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p3',
                    programStageId: 'p3s8',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    p3: 'Program 3',
                    p1s1: 'Stage 1',
                    p2s1: 'Stage 1',
                    p3s8: 'Stage 8',
                })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Program 1, Stage 1',
                'p2s1.de2': 'Program 2, Stage 1',
                'p3s8.de3': 'Stage 8',
            })
        })
    })

    describe('tracked-entity-bound dims', () => {
        it('never shows suffix for dims with trackedEntityTypeId', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'tet1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tet1',
                },
                {
                    id: 'tet1.created',
                    dimensionType: 'PERIOD',
                    trackedEntityTypeId: 'tet1',
                },
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2s2.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p2',
                    programStageId: 'p2s2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    p1s1: 'Stage A',
                    p2s2: 'Stage B',
                    tet1: 'TET 1',
                })
            )
            expect(result['tet1.enrollmentOu']).toBeUndefined()
            expect(result['tet1.created']).toBeUndefined()
        })

        it('classifies PROGRAM_ATTRIBUTE as TE-bound regardless of programId', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'attr1',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    programId: 'p1',
                },
                {
                    id: 'attr2',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    programId: 'p2',
                },
                {
                    id: 'p1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p2: 'Program 2' })
            )
            expect(result.attr1).toBeUndefined()
            expect(result.attr2).toBeUndefined()
            expect(result['p1.enrollmentOu']).toBe('Program 1')
        })
    })

    describe('unbound dims', () => {
        it('never shows suffix for dims with no program/stage/TET', () => {
            const dimensions: SuffixInput[] = [
                { id: 'lastUpdated', dimensionType: 'PERIOD' },
                { id: 'createdBy', dimensionType: 'USER' },
                { id: 'lastUpdatedBy', dimensionType: 'USER' },
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2s2.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p2',
                    programStageId: 'p2s2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    p1s1: 'Stage A',
                    p2s2: 'Stage B',
                })
            )
            expect(result.lastUpdated).toBeUndefined()
            expect(result.createdBy).toBeUndefined()
            expect(result.lastUpdatedBy).toBeUndefined()
        })
    })

    describe('program indicators', () => {
        it('treats PROGRAM_INDICATOR as program-bound (suffix when >1 program)', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'pi1',
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: 'p1',
                },
                {
                    id: 'pi2',
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: 'p2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p2: 'Program 2' })
            )
            expect(result).toEqual({
                pi1: 'Program 1',
                pi2: 'Program 2',
            })
        })

        it('does not suffix a single PROGRAM_INDICATOR alone', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'pi1',
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: 'p1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1' })
            )
            expect(result).toEqual({ pi1: undefined })
        })
    })

    describe('missing names', () => {
        it('falls back to no suffix when getName returns undefined for the stage', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p1s2.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s2',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p1s1: 'Stage 1' })
                // p1s2 deliberately missing
            )
            expect(result['p1s1.de1']).toBe('Stage 1')
            expect(result['p1s2.de2']).toBeUndefined()
        })

        it('keeps stage suffix when program name is missing on a colliding dim', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'p1s1.de1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p1',
                    programStageId: 'p1s1',
                },
                {
                    id: 'p2s1.de2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'p2',
                    programStageId: 'p2s1',
                },
            ]
            const result = getChipSuffixes(
                dimensions,
                buildGetName({
                    p2: 'Program 2',
                    p1s1: 'Stage 1',
                    p2s1: 'Stage 1',
                    // p1 deliberately missing
                })
            )
            expect(result['p1s1.de1']).toBe('Stage 1')
            expect(result['p2s1.de2']).toBe('Program 2, Stage 1')
        })
    })
})
