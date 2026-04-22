import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type {
    DimensionMetadataItem,
    MetadataItem,
    MetadataStore,
    Program,
} from '@types'
import { describe, it, expect } from 'vitest'
import {
    buildAxis,
    collectProgramDimensions,
    resolveTeiFields,
} from '../layout'

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => overrides as DimensionMetadataItem

const testCases = {
    lineListEnrollment: {
        outputType: 'ENROLLMENT',
        input: {
            program: { id: 'child' },
            itemsByDimension: {
                ou: ['USER_ORGUNIT'],
                bcgDoses: [],
                lastName: [],
                enrollmentDate: [],
                programStatus: ['COMPLETED', 'ACTIVE'],
                'birth.infantFeeding': [],
                'babyPostnatal.infantFeeding': [],
            },
            conditionsByDimension: {
                'birth.infantFeeding': {
                    condition: 'IN:Exclusive;Mixed',
                },
            },
            repetitionsByDimension: {
                'babyPostnatal.infantFeeding': {
                    mostRecent: 3,
                    oldest: 0,
                },
            },
            layout: {
                columns: [
                    'ou',
                    'bcgDoses',
                    'lastName',
                    'enrollmentDate',
                    'programStatus',
                    'birth.infantFeeding',
                    'babyPostnatal.infantFeeding',
                ],
                rows: [],
                filters: [],
            },
        },
        metadata: {
            ou: makeDim({ dimensionId: 'ou' }),
            bcgDoses: makeDim({ dimensionId: 'bcgDoses' }),
            lastName: makeDim({ dimensionId: 'lastName' }),
            enrollmentDate: makeDim({ dimensionId: 'enrollmentDate' }),
            programStatus: makeDim({ dimensionId: 'programStatus' }),
            'birth.infantFeeding': makeDim({
                dimensionId: 'infantFeeding',
                programStageId: 'birth',
            }),
            'babyPostnatal.infantFeeding': makeDim({
                dimensionId: 'infantFeeding',
                programStageId: 'babyPostnatal',
            }),
        },
        expected: {
            rows: [],
            columns: [
                {
                    dimension: 'ou',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                },
                {
                    dimension: 'bcgDoses',
                },
                {
                    dimension: 'lastName',
                },
                {
                    dimension: 'enrollmentDate',
                },
                {
                    dimension: 'programStatus',
                    items: [
                        {
                            id: 'COMPLETED',
                        },
                        {
                            id: 'ACTIVE',
                        },
                    ],
                },
                {
                    dimension: 'infantFeeding',
                    programStage: {
                        id: 'birth',
                    },
                    filter: 'IN:Exclusive;Mixed',
                },
                {
                    dimension: 'infantFeeding',
                    programStage: {
                        id: 'babyPostnatal',
                    },
                    repetition: {
                        indexes: [-2, -1, 0],
                    },
                },
            ],
            filters: [],
        },
    },
    lineListEvent: {
        outputType: 'EVENT',
        input: {
            itemsByDimension: {
                ou: ['USER_ORGUNIT'],
                enrollmentDate: [],
                firstName: [],
                bcgDoses: [],
                facilityOwnership: ['privateClinic', 'publicFacility'],
            },
            conditionsByDimension: {
                firstName: {
                    condition: 'ILIKE:je',
                },
            },
            repetitionsByDimension: {},
            layout: {
                columns: [
                    'ou',
                    'enrollmentDate',
                    'firstName',
                    'bcgDoses',
                    'facilityOwnership',
                ],
                rows: [],
                filters: [],
            },
        },
        metadata: {
            ou: makeDim({ dimensionId: 'ou' }),
            enrollmentDate: makeDim({ dimensionId: 'enrollmentDate' }),
            firstName: makeDim({ dimensionId: 'firstName' }),
            bcgDoses: makeDim({ dimensionId: 'bcgDoses' }),
            facilityOwnership: makeDim({ dimensionId: 'facilityOwnership' }),
        },
        expected: {
            rows: [],
            columns: [
                {
                    dimension: 'ou',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                },
                {
                    dimension: 'enrollmentDate',
                },
                {
                    dimension: 'firstName',
                    filter: 'ILIKE:je',
                },
                {
                    dimension: 'bcgDoses',
                },
                {
                    dimension: 'facilityOwnership',
                    items: [
                        {
                            id: 'privateClinic',
                        },
                        {
                            id: 'publicFacility',
                        },
                    ],
                },
            ],
            filters: [],
        },
    },
    lineListTrackedEntity: {
        input: {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            itemsByDimension: {
                ou: ['USER_ORGUNIT'],
                focusName: [],
                localFocusId: [],
                area: [],
                'program1Id.ou': ['bombali', 'bonthe', 'bo', 'kailahun'],
                'program1Id.enrollmentDate': [],
                'program1Id.stage1Id.focusDateOfClassification': [],
            },
            conditionsByDimension: {
                area: {
                    condition: 'GT:100',
                },
            },
            repetitionsByDimension: {},
            layout: {
                columns: [
                    'ou',
                    'focusName',
                    'localFocusId',
                    'area',
                    'program1Id.ou',
                    'program1Id.enrollmentDate',
                    'program1Id.stage1Id.focusDateOfClassification',
                ],
                rows: [],
                filters: [],
            },
        },
        metadata: {
            ou: makeDim({ dimensionId: 'ou' }),
            focusName: makeDim({ dimensionId: 'focusName' }),
            localFocusId: makeDim({ dimensionId: 'localFocusId' }),
            area: makeDim({ dimensionId: 'area' }),
            'program1Id.ou': makeDim({
                dimensionId: 'ou',
                programId: 'program1Id',
            }),
            'program1Id.enrollmentDate': makeDim({
                dimensionId: 'enrollmentDate',
                programId: 'program1Id',
            }),
            'program1Id.stage1Id.focusDateOfClassification': makeDim({
                dimensionId: 'focusDateOfClassification',
                programId: 'program1Id',
                programStageId: 'stage1Id',
            }),
        },
        expected: {
            rows: [],
            columns: [
                {
                    dimension: 'ou',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                },
                {
                    dimension: 'focusName',
                },
                {
                    dimension: 'localFocusId',
                },
                {
                    dimension: 'area',
                    filter: 'GT:100',
                },
                {
                    dimension: 'ou',
                    items: [
                        {
                            id: 'bombali',
                        },
                        {
                            id: 'bonthe',
                        },
                        {
                            id: 'bo',
                        },
                        {
                            id: 'kailahun',
                        },
                    ],
                    program: {
                        id: 'program1Id',
                    },
                },
                {
                    dimension: 'enrollmentDate',
                    program: {
                        id: 'program1Id',
                    },
                },
                {
                    dimension: 'focusDateOfClassification',
                    programStage: {
                        id: 'stage1Id',
                    },
                    program: {
                        id: 'program1Id',
                    },
                },
            ],
            filters: [],
        },
    },
}

describe('buildAxis', () => {
    it.each(Object.entries(testCases))(
        'should produce correct DimensionArray from visUiConfig %s columns',
        (_name, { input, metadata, expected }) => {
            const store = makeStore({
                dims: metadata as Record<string, DimensionMetadataItem>,
            })
            const result = buildAxis(
                input.layout.columns,
                input as unknown as VisUiConfigState,
                store
            )
            expect(result).toEqual(expected.columns)
        }
    )

    it('throws when metadata lookup returns undefined for a dimension', () => {
        const input = {
            layout: { columns: ['unknown.dim'], rows: [], filters: [] },
            itemsByDimension: { 'unknown.dim': [] },
            conditionsByDimension: {},
            repetitionsByDimension: {},
        }
        const store = makeStore({})
        expect(() =>
            buildAxis(
                input.layout.columns,
                input as unknown as VisUiConfigState,
                store
            )
        ).toThrow(
            'No metadata found for dimension "unknown.dim" — cannot decompose compound ID for API'
        )
    })
})

const makeStore = ({
    dims = {},
    metadata = {},
    programs = {},
}: {
    dims?: Record<string, DimensionMetadataItem>
    metadata?: Record<string, { id: string; name: string }>
    programs?: Record<string, Program>
}): MetadataStore =>
    ({
        getDimensionMetadataItem: (id: string) => dims[id],
        getMetadataItem: (id: string) => metadata[id] as MetadataItem,
        getProgramMetadataItem: (id: string) => programs[id],
    }) as unknown as MetadataStore

const layout = (ids: string[]): VisUiConfigState['layout'] => ({
    columns: ids,
    filters: [],
    rows: [],
})

const baseState = (
    outputType: VisUiConfigState['outputType'],
    ids: string[]
): VisUiConfigState =>
    ({
        outputType,
        layout: layout(ids),
    }) as unknown as VisUiConfigState

describe('resolveTeiFields', () => {
    it('TEI viz with TEAs → trackedEntityType set, attributeDimensions populated', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['tea1', 'tea2'])
        const store = makeStore({
            dims: {
                tea1: {
                    id: 'tea1',
                    dimensionId: 'tea1',
                    name: 'First name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    trackedEntityTypeId: 'tetA',
                },
                tea2: {
                    id: 'tea2',
                    dimensionId: 'tea2',
                    name: 'Last name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    trackedEntityTypeId: 'tetA',
                },
            },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: [
                { attribute: { id: 'tea1', name: 'First name' } },
                { attribute: { id: 'tea2', name: 'Last name' } },
            ],
        })
    })

    it('TEI viz with only registration fixed dims → trackedEntityType set via fixed-dim trackedEntityTypeId', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['tetA.ou'])
        const store = makeStore({
            dims: {
                'tetA.ou': {
                    id: 'tetA.ou',
                    dimensionId: 'ou',
                    name: 'Registration org. unit',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tetA',
                },
            },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: undefined,
        })
    })

    it('ENROLLMENT viz with TEA → trackedEntityType set, attributeDimensions populated', () => {
        const state = baseState('ENROLLMENT', ['tea1'])
        const store = makeStore({
            dims: {
                tea1: {
                    id: 'tea1',
                    dimensionId: 'tea1',
                    name: 'First name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    trackedEntityTypeId: 'tetA',
                },
            },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: [
                { attribute: { id: 'tea1', name: 'First name' } },
            ],
        })
    })

    it('ENROLLMENT viz without TEA → neither field emitted', () => {
        const state = baseState('ENROLLMENT', ['de1'])
        const store = makeStore({
            dims: {
                de1: {
                    id: 'de1',
                    dimensionId: 'de1',
                    name: 'Weight',
                    dimensionType: 'DATA_ELEMENT',
                },
            },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: undefined,
            attributeDimensions: undefined,
        })
    })

    it('EVENT viz with TEA → trackedEntityType cleared, attributeDimensions populated', () => {
        const state = baseState('EVENT', ['tea1'])
        const store = makeStore({
            dims: {
                tea1: {
                    id: 'tea1',
                    dimensionId: 'tea1',
                    name: 'First name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                },
            },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: undefined,
            attributeDimensions: [
                { attribute: { id: 'tea1', name: 'First name' } },
            ],
        })
    })

    it('TEI viz with no TET-scoped dim in layout → throws', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['de1'])
        const store = makeStore({
            dims: {
                de1: {
                    id: 'de1',
                    dimensionId: 'de1',
                    name: 'Weight',
                    dimensionType: 'DATA_ELEMENT',
                },
            },
        })

        expect(() => resolveTeiFields(state, store)).toThrow(
            'Cannot resolve trackedEntityType for outputType=TRACKED_ENTITY_INSTANCE: no layout dimension carries a trackedEntityTypeId'
        )
    })

    it('TEI viz with tetId on a dim but TET missing from metadata store → throws', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['tea1'])
        const store = makeStore({
            dims: {
                tea1: {
                    id: 'tea1',
                    dimensionId: 'tea1',
                    name: 'First name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    trackedEntityTypeId: 'tetGhost',
                },
            },
        })

        expect(() => resolveTeiFields(state, store)).toThrow(
            'Tracked entity type "tetGhost" referenced by a layout dimension but not found in the metadata store'
        )
    })

    it('layout dim missing from metadata store → throws', () => {
        const state = baseState('EVENT', ['ghost'])
        const store = makeStore({})

        expect(() => resolveTeiFields(state, store)).toThrow(
            'No metadata found for dimension "ghost" in the layout'
        )
    })
})

describe('collectProgramDimensions', () => {
    it('dedupes programs referenced across layout dims', () => {
        const state = baseState('ENROLLMENT', [
            'stage1.de1',
            'stage1.de2',
            'stage2.de3',
        ])
        const programA = {
            id: 'pA',
            name: 'Program A',
        } as unknown as Program
        const programB = {
            id: 'pB',
            name: 'Program B',
        } as unknown as Program
        const store = makeStore({
            dims: {
                'stage1.de1': {
                    id: 'stage1.de1',
                    dimensionId: 'de1',
                    name: 'DE1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'pA',
                    programStageId: 'stage1',
                },
                'stage1.de2': {
                    id: 'stage1.de2',
                    dimensionId: 'de2',
                    name: 'DE2',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'pA',
                    programStageId: 'stage1',
                },
                'stage2.de3': {
                    id: 'stage2.de3',
                    dimensionId: 'de3',
                    name: 'DE3',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'pB',
                    programStageId: 'stage2',
                },
            },
            programs: { pA: programA, pB: programB },
        })

        expect(collectProgramDimensions(state, store)).toEqual([
            programA,
            programB,
        ])
    })

    it('skips dims whose metadata has no programId', () => {
        const state = baseState('EVENT', ['lastUpdated'])
        const store = makeStore({
            dims: {
                lastUpdated: {
                    id: 'lastUpdated',
                    dimensionId: 'lastUpdated',
                    name: 'Last updated on',
                    dimensionType: 'PERIOD',
                },
            },
        })

        expect(collectProgramDimensions(state, store)).toEqual([])
    })

    it('throws when a referenced program is missing from the metadata store', () => {
        const state = baseState('EVENT', ['stage1.de1'])
        const store = makeStore({
            dims: {
                'stage1.de1': {
                    id: 'stage1.de1',
                    dimensionId: 'de1',
                    name: 'DE1',
                    dimensionType: 'DATA_ELEMENT',
                    programId: 'pMissing',
                    programStageId: 'stage1',
                },
            },
            programs: {},
        })

        expect(() => collectProgramDimensions(state, store)).toThrow(
            'Program "pMissing" referenced by dimension "stage1.de1" but not found in the metadata store'
        )
    })

    it('throws when a layout dim is missing from the metadata store', () => {
        const state = baseState('EVENT', ['ghost'])
        const store = makeStore({})

        expect(() => collectProgramDimensions(state, store)).toThrow(
            'No metadata found for dimension "ghost" in the layout'
        )
    })
})
