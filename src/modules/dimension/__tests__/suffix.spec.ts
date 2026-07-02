import {
    buildSuffixContext,
    getDimensionSuffix,
    type SuffixContext,
} from '@modules/dimension/suffix'
import type { DimensionMetadataItem, MetadataItem } from '@types'
import { describe, it, expect } from 'vitest'

/* buildSuffixContext reads only id and name off program/stage items, so the
 * tests pass minimal objects rather than full program/stage metadata. */
type NamedItem = { id: string; name?: string }

const contextOf = (
    programs: NamedItem[],
    programStages: NamedItem[]
): SuffixContext =>
    buildSuffixContext({
        programs: programs as unknown as MetadataItem[],
        programStages: programStages as unknown as MetadataItem[],
    })

/* getDimensionSuffix only reads the binding fields; the rest are defaults so the
 * tests stay about program/stage/TET bindings. */
const dim = (
    fields: Partial<DimensionMetadataItem> & { id: string }
): DimensionMetadataItem => ({
    dimensionId: fields.id,
    name: fields.id,
    dimensionType: 'DATA_ELEMENT',
    ...fields,
})

describe('buildSuffixContext', () => {
    it('counts distinct programs and stages from the item lists', () => {
        const context = contextOf(
            [
                { id: 'p1', name: 'Program 1' },
                { id: 'p2', name: 'Program 2' },
            ],
            [{ id: 'p1s1', name: 'Stage 1' }]
        )
        expect(context.programCount).toBe(2)
        expect(context.stageCount).toBe(1)
        expect(context.programNameById.get('p1')).toBe('Program 1')
        expect(context.stageNameById.get('p1s1')).toBe('Stage 1')
    })

    it('marks only stages whose name is shared by another stage as colliding', () => {
        const context = contextOf(
            [],
            [
                { id: 'p1s1', name: 'Stage 1' },
                { id: 'p2s1', name: 'Stage 1' },
                { id: 'p3s8', name: 'Stage 8' },
            ]
        )
        expect([...context.collidingStageIds].sort()).toEqual(['p1s1', 'p2s1'])
    })
})

describe('getDimensionSuffix', () => {
    describe('spec example 1: single program, single stage', () => {
        it('returns no suffix for any stage-bound dim', () => {
            const context = contextOf(
                [{ id: 'p1', name: 'Program 1' }],
                [{ id: 'p1s1', name: 'Stage 1' }]
            )
            const stageBound = { programId: 'p1', programStageId: 'p1s1' }
            expect(
                getDimensionSuffix(
                    dim({ id: 'p1s1.de1', ...stageBound }),
                    context
                )
            ).toBeUndefined()
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.eventStatus',
                        dimensionType: 'STATUS',
                        ...stageBound,
                    }),
                    context
                )
            ).toBeUndefined()
        })
    })

    describe('spec example 2: single program, single stage + program-bound dims', () => {
        it('returns no suffix for stage-bound or program-bound dims', () => {
            const context = contextOf(
                [{ id: 'p1', name: 'Program 1' }],
                [{ id: 'p1s1', name: 'Stage 1' }]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBeUndefined()
            expect(
                getDimensionSuffix(
                    dim({ id: 'p1.programStatus', programId: 'p1' }),
                    context
                )
            ).toBeUndefined()
        })
    })

    describe('spec example 3: single program, multiple stages', () => {
        it('returns the stage name as suffix on each stage-bound dim', () => {
            const context = contextOf(
                [{ id: 'p1', name: 'Program 1' }],
                [
                    { id: 'p1s1', name: 'Stage 1' },
                    { id: 'p1s2', name: 'Stage 2' },
                ]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBe('Stage 1')
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s2.de2',
                        programId: 'p1',
                        programStageId: 'p1s2',
                    }),
                    context
                )
            ).toBe('Stage 2')
        })
    })

    describe('spec example 4: single program, multiple stages + program-bound dims', () => {
        it('suffixes stage-bound dims with the stage name; program-bound dims get none', () => {
            const context = contextOf(
                [{ id: 'p1', name: 'Program 1' }],
                [
                    { id: 'p1s1', name: 'Stage 1' },
                    { id: 'p1s2', name: 'Stage 2' },
                ]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBe('Stage 1')
            expect(
                getDimensionSuffix(
                    dim({ id: 'p1.programStatus', programId: 'p1' }),
                    context
                )
            ).toBeUndefined()
        })
    })

    describe('spec example 5: multiple programs, program-bound dims only', () => {
        it('returns the program name as suffix on each program-bound dim', () => {
            const context = contextOf(
                [
                    { id: 'p1', name: 'Program 1' },
                    { id: 'p2', name: 'Program 2' },
                ],
                []
            )
            expect(
                getDimensionSuffix(
                    dim({ id: 'p1.enrollmentOu', programId: 'p1' }),
                    context
                )
            ).toBe('Program 1')
            expect(
                getDimensionSuffix(
                    dim({ id: 'p2.programStatus', programId: 'p2' }),
                    context
                )
            ).toBe('Program 2')
        })
    })

    describe('spec example 6: multiple programs, single stage + program-bound dims', () => {
        it('falls back to program name for the stage-bound dim because stageCount is 1', () => {
            const context = contextOf(
                [
                    { id: 'p1', name: 'Program 1' },
                    { id: 'p2', name: 'Program 2' },
                ],
                [{ id: 'p1s1', name: 'Stage 1' }]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBe('Program 1')
            expect(
                getDimensionSuffix(
                    dim({ id: 'p2.enrollmentOu', programId: 'p2' }),
                    context
                )
            ).toBe('Program 2')
        })
    })

    describe('spec example 7: multiple programs, multiple stages', () => {
        it('uses stage name for stage-bound dims and program name for program-bound dims', () => {
            const context = contextOf(
                [
                    { id: 'p1', name: 'Program 1' },
                    { id: 'p2', name: 'Program 2' },
                    { id: 'p3', name: 'Program 3' },
                ],
                [
                    { id: 'p1s1', name: 'Stage 1' },
                    { id: 'p2s5', name: 'Stage 5' },
                ]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBe('Stage 1')
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p2s5.eventStatus',
                        programId: 'p2',
                        programStageId: 'p2s5',
                    }),
                    context
                )
            ).toBe('Stage 5')
            expect(
                getDimensionSuffix(
                    dim({ id: 'p3.enrollmentDate', programId: 'p3' }),
                    context
                )
            ).toBe('Program 3')
        })
    })

    describe('spec example 8: multiple programs, multiple stages, identical stage names', () => {
        it('returns "Program, Stage" only for the colliding stages; unique stage names keep the bare stage suffix', () => {
            const context = contextOf(
                [
                    { id: 'p1', name: 'Program 1' },
                    { id: 'p2', name: 'Program 2' },
                    { id: 'p3', name: 'Program 3' },
                ],
                [
                    { id: 'p1s1', name: 'Stage 1' },
                    { id: 'p2s1', name: 'Stage 1' },
                    { id: 'p3s8', name: 'Stage 8' },
                ]
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p1s1.de1',
                        programId: 'p1',
                        programStageId: 'p1s1',
                    }),
                    context
                )
            ).toBe('Program 1, Stage 1')
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p2s1.de2',
                        programId: 'p2',
                        programStageId: 'p2s1',
                    }),
                    context
                )
            ).toBe('Program 2, Stage 1')
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'p3s8.de3',
                        programId: 'p3',
                        programStageId: 'p3s8',
                    }),
                    context
                )
            ).toBe('Stage 8')
        })
    })

    describe('tracked-entity-bound dims', () => {
        it('never get a suffix, even when programs > 1', () => {
            const context = contextOf(
                [
                    { id: 'p1', name: 'Program 1' },
                    { id: 'p2', name: 'Program 2' },
                ],
                []
            )
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'tet1.enrollmentOu',
                        dimensionType: 'ORGANISATION_UNIT',
                        trackedEntityTypeId: 'tet1',
                    }),
                    context
                )
            ).toBeUndefined()
            expect(
                getDimensionSuffix(
                    dim({
                        id: 'attrA',
                        dimensionType: 'PROGRAM_ATTRIBUTE',
                        trackedEntityTypeId: 'tet1',
                    }),
                    context
                )
            ).toBeUndefined()
        })
    })

    describe('edge cases', () => {
        it('returns no suffix for unbound dims (no program/stage/TET)', () => {
            const context = contextOf(
                [{ id: 'p1', name: 'Program 1' }],
                [{ id: 'p1s1', name: 'Stage 1' }]
            )
            expect(
                getDimensionSuffix(
                    dim({ id: 'lastUpdated', dimensionType: 'PERIOD' }),
                    context
                )
            ).toBeUndefined()
            expect(
                getDimensionSuffix(dim({ id: 'createdBy' }), context)
            ).toBeUndefined()
        })
    })
})
