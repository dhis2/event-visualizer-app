import { describe, it, expect } from 'vitest'
import { getDimensionSuffixes, type SuffixInput } from '../dimension-suffix'

const buildGetName =
    (names: Record<string, string>): ((id: string) => string | undefined) =>
    (id) =>
        names[id]

describe('getDimensionSuffixes', () => {
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
            const result = getDimensionSuffixes(
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
            const result = getDimensionSuffixes(
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
            const result = getDimensionSuffixes(
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

    describe('spec example 4: single program, multiple stages + program-bound dims', () => {
        it('suffixes only stage-bound dims with the stage name; program-bound dims get no suffix', () => {
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
            const result = getDimensionSuffixes(
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

    describe('spec example 5: multiple programs, program-bound dims only', () => {
        it('returns the program name as suffix on each program-bound dim', () => {
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
            const result = getDimensionSuffixes(
                dimensions,
                buildGetName({ p1: 'Program 1', p2: 'Program 2' })
            )
            expect(result).toEqual({
                'p1.enrollmentOu': 'Program 1',
                'p2.programStatus': 'Program 2',
            })
        })
    })

    describe('spec example 6: multiple programs, single stage + program-bound dims', () => {
        it('falls back to program name for the stage-bound dim because stageCount is 1', () => {
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
            const result = getDimensionSuffixes(
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
        it('uses stage name for stage-bound dims and program name for program-bound dims', () => {
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
            const result = getDimensionSuffixes(
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

    describe('spec example 8: multiple programs, multiple stages, some identical stage names', () => {
        it('returns "Program, Stage" only for the colliding stages; unique stage names keep the bare stage suffix', () => {
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
            const result = getDimensionSuffixes(
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
        it('never get a suffix, even when programs > 1', () => {
            const dimensions: SuffixInput[] = [
                {
                    id: 'tet1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tet1',
                },
                {
                    id: 'attrA',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    trackedEntityTypeId: 'tet1',
                },
                {
                    id: 'p1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p1',
                },
                {
                    id: 'p2.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: 'p2',
                },
            ]
            const result = getDimensionSuffixes(
                dimensions,
                buildGetName({
                    p1: 'Program 1',
                    p2: 'Program 2',
                    tet1: 'TET 1',
                })
            )
            expect(result).toEqual({
                'tet1.enrollmentOu': undefined,
                attrA: undefined,
                'p1.enrollmentOu': 'Program 1',
                'p2.enrollmentOu': 'Program 2',
            })
        })
    })

    describe('edge cases', () => {
        it('returns {} for an empty input', () => {
            expect(getDimensionSuffixes([], () => undefined)).toEqual({})
        })

        it('returns no suffix for unbound dims (no program/stage/TET)', () => {
            const dimensions: SuffixInput[] = [
                { id: 'lastUpdated', dimensionType: 'PERIOD' },
                { id: 'createdBy' },
            ]
            const result = getDimensionSuffixes(dimensions, () => 'Some Name')
            expect(result).toEqual({
                lastUpdated: undefined,
                createdBy: undefined,
            })
        })

        it('returns undefined cleanly when getName resolves nothing for a stage-bound dim', () => {
            const dimensions: SuffixInput[] = [
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
            const result = getDimensionSuffixes(dimensions, () => undefined)
            expect(result).toEqual({
                'p1s1.de1': undefined,
                'p2s2.de2': undefined,
            })
        })

        it('omits the compound prefix when programName is unresolvable on a stage-name collision', () => {
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
            const result = getDimensionSuffixes(
                dimensions,
                buildGetName({ p1s1: 'Stage 1', p2s1: 'Stage 1' })
            )
            expect(result).toEqual({
                'p1s1.de1': 'Stage 1',
                'p2s1.de2': 'Stage 1',
            })
        })
    })
})
