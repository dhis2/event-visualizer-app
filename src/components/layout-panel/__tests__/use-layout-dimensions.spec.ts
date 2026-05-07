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
    },
    p1s2: {
        id: 'p1s2',
        name: 'P1 Stage2',
        repeatable: false,
        hideDueDate: false,
    },
    p2s1: {
        id: 'p2s1',
        name: 'P2 Stage1',
        repeatable: false,
        hideDueDate: false,
    },
}

describe('useLayoutDimensions', () => {
    describe('LayoutDimension shape', () => {
        it('populates id, name, dimensionId, programId, programStageId, dimensionType, optionSet, valueType from metadata', async () => {
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
                        outputType: 'ENROLLMENT',
                    }),
                { metadata }
            )
            expect(result.current).toEqual([
                {
                    id: 'p1s1.d1',
                    name: 'Dimension1',
                    dimensionId: 'd1',
                    programStageId: 'p1s1',
                    dimensionType: 'DATA_ELEMENT',
                    optionSet: 'OptionSet1',
                    valueType: 'TEXT',
                    suffix: undefined,
                },
            ])
        })

        it('parses programId from a TRACKED_ENTITY_INSTANCE compound ID', async () => {
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
                        outputType: 'TRACKED_ENTITY_INSTANCE',
                    }),
                { metadata }
            )
            const [dim] = result.current
            expect(dim.id).toBe('p1.p1s1.d1')
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
            'p1.p1s1.d1': {
                id: 'p1.p1s1.d1',
                name: 'Dimension1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            'p2.p2s1.d2': {
                id: 'p2.p2s1.d2',
                name: 'Dimension2',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            },
            'p1.enrollmentDate': {
                id: 'p1.enrollmentDate',
                name: 'Date of enrollment',
                dimensionType: 'PERIOD',
            },
        }

        it('returns no suffix when layout has only one program and one stage', async () => {
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: ['p1s1.d1'],
                        outputType: 'ENROLLMENT',
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
                        outputType: 'ENROLLMENT',
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
                        dimensionIds: ['p1.p1s1.d1', 'p2.enrollmentDate'],
                        outputType: 'TRACKED_ENTITY_INSTANCE',
                    }),
                {
                    metadata: {
                        ...dimMetadata,
                        'p2.enrollmentDate': {
                            id: 'p2.enrollmentDate',
                            name: 'Date of enrollment',
                            dimensionType: 'PERIOD',
                        },
                    },
                }
            )
            expect(result.current.map((d) => d.suffix)).toEqual([
                'Program1',
                'Program2',
            ])
        })

        it('does not suffix tracked-entity-bound dims even when layout spans multiple programs', async () => {
            const metadata = {
                ...dimMetadata,
                tet1: {
                    id: 'tet1',
                    name: 'TET 1',
                },
                'tet1.enrollmentOu': {
                    id: 'tet1.enrollmentOu',
                    dimensionId: 'enrollmentOu',
                    name: 'Registration org. unit',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tet1',
                },
                'p2.enrollmentDate': {
                    id: 'p2.enrollmentDate',
                    name: 'Date of enrollment',
                    dimensionType: 'PERIOD',
                },
            }
            const { result } = await renderHookWithAppWrapper(
                () =>
                    useLayoutDimensions({
                        dimensionIds: [
                            'tet1.enrollmentOu',
                            'p1.p1s1.d1',
                            'p2.enrollmentDate',
                        ],
                        outputType: 'TRACKED_ENTITY_INSTANCE',
                    }),
                { metadata }
            )
            const [tetDim, stageDim, programDim] = result.current
            expect(tetDim.suffix).toBeUndefined()
            expect(stageDim.suffix).toBe('Program1')
            expect(programDim.suffix).toBe('Program2')
        })
    })
})
