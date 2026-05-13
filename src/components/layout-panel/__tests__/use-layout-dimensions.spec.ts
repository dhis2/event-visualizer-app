import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { describe, it, expect } from 'vitest'
import { useLayoutDimensions } from '../use-layout-dimensions'

const baseMetadata = {
    p1: {
        id: 'p1',
        name: 'Program1',
        programType: 'WITH_REGISTRATION',
    },
    p2: {
        id: 'p2',
        name: 'Program2',
        programType: 'WITH_REGISTRATION',
    },
    p1s1: {
        id: 'p1s1',
        name: 'P1 Stage1',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
    p1s2: {
        id: 'p1s2',
        name: 'P1 Stage2',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
    p2s1: {
        id: 'p2s1',
        name: 'P2 Stage1',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p2' },
    },
}

describe('useLayoutDimensions', () => {
    describe('LayoutDimension shape', () => {
        it('populates id, name, dimensionId, programId, programStageId, dimensionType, optionSet, valueType from store metadata', async () => {
            const metadata = {
                ...baseMetadata,
                'p1s1.d1': {
                    id: 'p1s1.d1',
                    name: 'Dimension1',
                    dimensionType: 'DATA_ELEMENT',
                    optionSetId: 'OptionSet1',
                    valueType: 'TEXT',
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1'],
                    }),
                { metadata }
            )
            expect(result.current).toEqual([
                {
                    id: 'p1s1.d1',
                    name: 'Dimension1',
                    dimensionId: 'd1',
                    programId: 'p1',
                    programStageId: 'p1s1',
                    dimensionType: 'DATA_ELEMENT',
                    optionSet: 'OptionSet1',
                    valueType: 'TEXT',
                    suffix: undefined,
                },
            ])
        })

        it('exposes programId/programStageId enriched by the store from a 3-segment compound ID', async () => {
            const metadata = {
                ...baseMetadata,
                'p1.p1s1.d1': {
                    id: 'p1.p1s1.d1',
                    name: 'Dimension1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1.p1s1.d1'],
                    }),
                { metadata }
            )
            const [dim] = result.current
            expect(dim.dimensionId).toBe('d1')
            expect(dim.programId).toBe('p1')
            expect(dim.programStageId).toBe('p1s1')
        })
    })

    describe('suffix wiring', () => {
        const dimMetadata = {
            ...baseMetadata,
            'p1s1.d1': {
                id: 'p1s1.d1',
                name: 'Dimension1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            'p1s2.d2': {
                id: 'p1s2.d2',
                name: 'Dimension2',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            'p2s1.d1': {
                id: 'p2s1.d1',
                name: 'Dimension1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            'p1.enrollmentDate': {
                id: 'p1.enrollmentDate',
                name: 'Date of enrollment',
                dimensionType: 'PERIOD',
            },
            'p2.enrollmentDate': {
                id: 'p2.enrollmentDate',
                name: 'Date of enrollment',
                dimensionType: 'PERIOD',
            },
        }

        it('returns no suffix when layout has only one program and one stage', async () => {
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1'],
                    }),
                { metadata: dimMetadata }
            )
            expect(result.current[0].suffix).toBeUndefined()
        })

        it('applies stage-name suffix when layout has multiple stages from one program', async () => {
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1', 'p1s2.d2'],
                    }),
                { metadata: dimMetadata }
            )
            expect(result.current.map((d) => d.suffix)).toEqual([
                'P1 Stage1',
                'P1 Stage2',
            ])
        })

        it('applies program-name suffix to a stage-bound dim when layout has multiple programs but only one stage', async () => {
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1', 'p2.enrollmentDate'],
                    }),
                { metadata: dimMetadata }
            )
            expect(result.current.map((d) => d.suffix)).toEqual([
                'Program1',
                'Program2',
            ])
        })

        it('applies compound "Program, Stage" suffix when stage names collide across programs', async () => {
            const metadata = {
                ...dimMetadata,
                p2s1: {
                    id: 'p2s1',
                    name: 'P1 Stage1', // colliding stage name
                    repeatable: false,
                    hideDueDate: false,
                    program: { id: 'p2' },
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1', 'p2s1.d1'],
                    }),
                { metadata }
            )
            expect(result.current.map((d) => d.suffix)).toEqual([
                'Program1, P1 Stage1',
                'Program2, P1 Stage1',
            ])
        })

        it('never suffixes tracked-entity-bound dims, even with multiple programs', async () => {
            const metadata = {
                ...dimMetadata,
                tet1: {
                    id: 'tet1',
                    name: 'TET 1',
                },
                'tet1.enrollmentOu': {
                    id: 'tet1.enrollmentOu',
                    name: 'Registration org. unit',
                    dimensionType: 'ORGANISATION_UNIT',
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: [
                            'tet1.enrollmentOu',
                            'p1.enrollmentDate',
                            'p2.enrollmentDate',
                        ],
                    }),
                { metadata }
            )
            expect(result.current.map((d) => d.suffix)).toEqual([
                undefined,
                'Program1',
                'Program2',
            ])
        })

        it('does not suffix unbound dims', async () => {
            const metadata = {
                ...dimMetadata,
                lastUpdated: {
                    id: 'lastUpdated',
                    name: 'Last updated on',
                    dimensionType: 'PERIOD',
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1', 'p1s2.d2', 'lastUpdated'],
                    }),
                { metadata }
            )
            const lastUpdated = result.current.find(
                (d) => d.id === 'lastUpdated'
            )
            expect(lastUpdated?.suffix).toBeUndefined()
        })
    })
})
