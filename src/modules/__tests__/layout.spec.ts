import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type {
    Axis,
    DimensionMetadataItem,
    MetadataItem,
    MetadataStore,
    Program,
    VisualizationType,
} from '@types'
import { describe, it, expect } from 'vitest'
import {
    buildAxis,
    collectProgramDimensions,
    getInvalidAxesForDimension,
    isAxisInvalidForDimension,
    isDimensionAggregatable,
    resolveTeiFields,
    resolveTetId,
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
    const trackerProgram = {
        id: 'progA',
        name: 'Child program',
        programType: 'WITH_REGISTRATION',
        trackedEntityType: { id: 'tetA', name: 'Person' },
    } as unknown as Program
    const eventProgram = {
        id: 'progB',
        name: 'Event program',
        programType: 'WITHOUT_REGISTRATION',
    } as unknown as Program

    const tetOuDim: DimensionMetadataItem = {
        id: 'tetA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        name: 'Registration org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetA',
    } as DimensionMetadataItem
    const enrollmentOuDim: DimensionMetadataItem = {
        id: 'progA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        name: 'Enrollment org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progA',
    } as DimensionMetadataItem
    const stageOuDim: DimensionMetadataItem = {
        id: 'stage1.ou',
        dimensionId: 'ou',
        name: 'Event org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progA',
        programStageId: 'stage1',
    } as DimensionMetadataItem
    const eventProgramOuDim: DimensionMetadataItem = {
        id: 'evtStage.ou',
        dimensionId: 'ou',
        name: 'Event org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progB',
        programStageId: 'evtStage',
    } as DimensionMetadataItem

    const tea1Dim: DimensionMetadataItem = {
        id: 'tea1',
        dimensionId: 'tea1',
        name: 'First name',
        dimensionType: 'PROGRAM_ATTRIBUTE',
    } as DimensionMetadataItem
    const tea2Dim: DimensionMetadataItem = {
        id: 'tea2',
        dimensionId: 'tea2',
        name: 'Last name',
        dimensionType: 'PROGRAM_ATTRIBUTE',
    } as DimensionMetadataItem

    it('TEI vis with TET registration ou → TET resolved from ouDim.trackedEntityTypeId', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', [
            'tetA.enrollmentOu',
            'tea1',
            'tea2',
        ])
        const store = makeStore({
            dims: {
                'tetA.enrollmentOu': tetOuDim,
                tea1: tea1Dim,
                tea2: tea2Dim,
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

    it('TEI vis with stage ou → walks programId → program.trackedEntityType', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['stage1.ou'])
        const store = makeStore({
            dims: { 'stage1.ou': stageOuDim },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
            programs: { progA: trackerProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: undefined,
        })
    })

    it('TEI vis with enrollment ou → walks programId → program.trackedEntityType', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', [
            'progA.enrollmentOu',
        ])
        const store = makeStore({
            dims: { 'progA.enrollmentOu': enrollmentOuDim },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
            programs: { progA: trackerProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: undefined,
        })
    })

    it('TEI vis with no TET-bound dim in layout → throws', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['tea1'])
        const store = makeStore({
            dims: { tea1: tea1Dim },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
        })

        expect(() => resolveTeiFields(state, store)).toThrow(
            'Cannot resolve trackedEntityType for outputType=TRACKED_ENTITY_INSTANCE: the layout has no dimension carrying TET context'
        )
    })

    it('TEI vis with event-program stage ou → throws (program has no TET)', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', ['evtStage.ou'])
        const store = makeStore({
            dims: { 'evtStage.ou': eventProgramOuDim },
            programs: { progB: eventProgram },
        })

        expect(() => resolveTeiFields(state, store)).toThrow(
            'Cannot resolve trackedEntityType for outputType=TRACKED_ENTITY_INSTANCE: the layout has no dimension carrying TET context'
        )
    })

    it('ENROLLMENT vis with enrollment ou and TEAs → TET + attributeDimensions both emitted', () => {
        const state = baseState('ENROLLMENT', ['progA.enrollmentOu', 'tea1'])
        const store = makeStore({
            dims: {
                'progA.enrollmentOu': enrollmentOuDim,
                tea1: tea1Dim,
            },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
            programs: { progA: trackerProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: [
                { attribute: { id: 'tea1', name: 'First name' } },
            ],
        })
    })

    it('ENROLLMENT vis with enrollment ou, no TEAs → TET emitted (program is tracker)', () => {
        const state = baseState('ENROLLMENT', ['progA.enrollmentOu'])
        const store = makeStore({
            dims: { 'progA.enrollmentOu': enrollmentOuDim },
            metadata: { tetA: { id: 'tetA', name: 'Person' } },
            programs: { progA: trackerProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: { id: 'tetA', name: 'Person' },
            attributeDimensions: undefined,
        })
    })

    it('EVENT vis with event-program stage ou → no TET, no attributeDimensions', () => {
        const state = baseState('EVENT', ['evtStage.ou'])
        const store = makeStore({
            dims: { 'evtStage.ou': eventProgramOuDim },
            programs: { progB: eventProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: undefined,
            attributeDimensions: undefined,
        })
    })

    it('EVENT vis with event-program ou and TEA → attributeDimensions populated, no TET', () => {
        const state = baseState('EVENT', ['evtStage.ou', 'tea1'])
        const store = makeStore({
            dims: { 'evtStage.ou': eventProgramOuDim, tea1: tea1Dim },
            programs: { progB: eventProgram },
        })

        expect(resolveTeiFields(state, store)).toEqual({
            trackedEntityType: undefined,
            attributeDimensions: [
                { attribute: { id: 'tea1', name: 'First name' } },
            ],
        })
    })

    it('resolved tetId missing from metadata store → throws', () => {
        const state = baseState('TRACKED_ENTITY_INSTANCE', [
            'tetA.enrollmentOu',
        ])
        const store = makeStore({
            dims: { 'tetA.enrollmentOu': tetOuDim },
        })

        expect(() => resolveTeiFields(state, store)).toThrow(
            'Tracked entity type "tetA" referenced but not found in the metadata store'
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

describe('resolveTetId', () => {
    const trackerProgramA = {
        id: 'progA',
        trackedEntityType: { id: 'tetA', name: 'Person' },
    } as unknown as Program
    const trackerProgramC = {
        id: 'progC',
        trackedEntityType: { id: 'tetB', name: 'Household' },
    } as unknown as Program
    const eventProgram = { id: 'progB' } as unknown as Program

    const tetOuDim = {
        id: 'tetA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetA',
    } as DimensionMetadataItem
    const enrollmentOuDim = {
        id: 'progA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progA',
    } as DimensionMetadataItem
    const stageOuDim = {
        id: 'stage1.ou',
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progA',
        programStageId: 'stage1',
    } as DimensionMetadataItem
    const eventProgramOuDim = {
        id: 'evtStage.ou',
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        programId: 'progB',
        programStageId: 'evtStage',
    } as DimensionMetadataItem
    const contextlessTeaDim = {
        id: 'tea1',
        dimensionId: 'tea1',
        dimensionType: 'PROGRAM_ATTRIBUTE',
    } as DimensionMetadataItem
    const teaWithTetDim = {
        id: 'tea1',
        dimensionId: 'tea1',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        trackedEntityTypeId: 'tetA',
    } as DimensionMetadataItem
    const dataElementInTrackerProgramDim = {
        id: 'stage1.de1',
        dimensionId: 'de1',
        dimensionType: 'DATA_ELEMENT',
        programId: 'progA',
        programStageId: 'stage1',
    } as DimensionMetadataItem
    const programIndicatorInOtherTrackerDim = {
        id: 'pi1',
        dimensionId: 'pi1',
        dimensionType: 'PROGRAM_INDICATOR',
        programId: 'progC',
    } as DimensionMetadataItem

    it('returns trackedEntityTypeId directly when an ou dim carries it', () => {
        const store = makeStore({
            dims: { 'tetA.enrollmentOu': tetOuDim },
        })

        expect(resolveTetId(['tetA.enrollmentOu'], store)).toBe('tetA')
    })

    it('walks programId → program.trackedEntityType for enrollment ou', () => {
        const store = makeStore({
            dims: { 'progA.enrollmentOu': enrollmentOuDim },
            programs: { progA: trackerProgramA },
        })

        expect(resolveTetId(['progA.enrollmentOu'], store)).toBe('tetA')
    })

    it('walks programId → program.trackedEntityType for stage ou', () => {
        const store = makeStore({
            dims: { 'stage1.ou': stageOuDim },
            programs: { progA: trackerProgramA },
        })

        expect(resolveTetId(['stage1.ou'], store)).toBe('tetA')
    })

    it('returns trackedEntityTypeId directly when a TEA dim carries it (no OU in layout)', () => {
        const store = makeStore({
            dims: { tea1: teaWithTetDim },
        })

        expect(resolveTetId(['tea1'], store)).toBe('tetA')
    })

    it('walks programId for a non-OU dim (data element in tracker program)', () => {
        const store = makeStore({
            dims: { 'stage1.de1': dataElementInTrackerProgramDim },
            programs: { progA: trackerProgramA },
        })

        expect(resolveTetId(['stage1.de1'], store)).toBe('tetA')
    })

    it('returns the single TET when multiple dims all reference the same TET', () => {
        const store = makeStore({
            dims: {
                'stage1.ou': stageOuDim,
                tea1: teaWithTetDim,
                'stage1.de1': dataElementInTrackerProgramDim,
            },
            programs: { progA: trackerProgramA },
        })

        expect(resolveTetId(['stage1.ou', 'tea1', 'stage1.de1'], store)).toBe(
            'tetA'
        )
    })

    it('ignores dims without TET context (event-program stage ou) when another dim provides TET', () => {
        const store = makeStore({
            dims: {
                'evtStage.ou': eventProgramOuDim,
                tea1: teaWithTetDim,
            },
            programs: { progB: eventProgram },
        })

        expect(resolveTetId(['evtStage.ou', 'tea1'], store)).toBe('tetA')
    })

    it('returns null for event-program-only layout (program has no TET)', () => {
        const store = makeStore({
            dims: { 'evtStage.ou': eventProgramOuDim },
            programs: { progB: eventProgram },
        })

        expect(resolveTetId(['evtStage.ou'], store)).toBeNull()
    })

    it('returns null when no layout dim carries TET context', () => {
        const store = makeStore({
            dims: { tea1: contextlessTeaDim },
        })

        expect(resolveTetId(['tea1'], store)).toBeNull()
    })

    it('returns the first TET in layout order when dims reference different TETs', () => {
        /* Multi-TET layouts are an invalid state that the action buttons
         * surface separately via tetCountInLayout; resolveTetId picks the
         * first TET id so callers can still render a single-TET context. */
        const store = makeStore({
            dims: {
                tea1: teaWithTetDim,
                pi1: programIndicatorInOtherTrackerDim,
            },
            programs: { progC: trackerProgramC },
        })

        expect(resolveTetId(['tea1', 'pi1'], store)).toBe('tetA')
        expect(resolveTetId(['pi1', 'tea1'], store)).toBe('tetB')
    })

    it('throws when a layout dim is missing from the metadata store', () => {
        const store = makeStore({})

        expect(() => resolveTetId(['ghost'], store)).toThrow(
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

describe('isDimensionAggregatable', () => {
    describe('DATA_ELEMENT', () => {
        it.each([
            'NUMBER',
            'INTEGER',
            'INTEGER_POSITIVE',
            'INTEGER_NEGATIVE',
            'INTEGER_ZERO_OR_POSITIVE',
            'PERCENTAGE',
            'UNIT_INTERVAL',
            'BOOLEAN',
            'TRUE_ONLY',
        ] as const)('is aggregatable when valueType is %s', (valueType) => {
            expect(
                isDimensionAggregatable(
                    makeDim({ dimensionType: 'DATA_ELEMENT', valueType })
                )
            ).toBe(true)
        })

        it.each([
            'TEXT',
            'LONG_TEXT',
            'MULTI_TEXT',
            'LETTER',
            'PHONE_NUMBER',
            'EMAIL',
            'DATE',
            'DATETIME',
            'TIME',
            'COORDINATE',
            'FILE_RESOURCE',
            'IMAGE',
            'GEOJSON',
            'URL',
            'AGE',
            'ORGANISATION_UNIT',
            'USERNAME',
        ] as const)('is non-aggregatable when valueType is %s', (valueType) => {
            expect(
                isDimensionAggregatable(
                    makeDim({ dimensionType: 'DATA_ELEMENT', valueType })
                )
            ).toBe(false)
        })

        it('is non-aggregatable when valueType is missing', () => {
            expect(
                isDimensionAggregatable(
                    makeDim({ dimensionType: 'DATA_ELEMENT' })
                )
            ).toBe(false)
        })
    })

    describe('PROGRAM_ATTRIBUTE', () => {
        it('is aggregatable when numeric', () => {
            expect(
                isDimensionAggregatable(
                    makeDim({
                        dimensionType: 'PROGRAM_ATTRIBUTE',
                        valueType: 'NUMBER',
                    })
                )
            ).toBe(true)
        })

        it('is non-aggregatable when text', () => {
            expect(
                isDimensionAggregatable(
                    makeDim({
                        dimensionType: 'PROGRAM_ATTRIBUTE',
                        valueType: 'TEXT',
                    })
                )
            ).toBe(false)
        })
    })

    describe('categorical dimension types are always aggregatable', () => {
        it.each([
            ['PROGRAM_INDICATOR', undefined],
            ['PROGRAM_INDICATOR', 'NUMBER'],
            ['STATUS', 'TEXT'],
            ['CATEGORY', undefined],
            ['CATEGORY', 'TEXT'],
            ['CATEGORY_OPTION_GROUP_SET', undefined],
            ['CATEGORY_OPTION_GROUP_SET', 'TEXT'],
            ['ORGANISATION_UNIT_GROUP_SET', 'TEXT'],
            ['ORGANISATION_UNIT', 'ORGANISATION_UNIT'],
            ['ORGANISATION_UNIT', undefined],
            ['PERIOD', 'DATE'],
            ['PERIOD', 'DATETIME'],
        ] as const)(
            'treats %s (valueType=%s) as aggregatable',
            (dimensionType, valueType) => {
                expect(
                    isDimensionAggregatable(
                        makeDim({ dimensionType, valueType })
                    )
                ).toBe(true)
            }
        )
    })

    describe('per-record dimension types are non-aggregatable', () => {
        it.each([['USER', undefined]] as const)(
            'treats %s (valueType=%s) as non-aggregatable',
            (dimensionType, valueType) => {
                expect(
                    isDimensionAggregatable(
                        makeDim({ dimensionType, valueType })
                    )
                ).toBe(false)
            }
        )
    })
})

describe('getInvalidAxesForDimension', () => {
    const textDataElement = makeDim({
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    })
    const numberDataElement = makeDim({
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    })
    const programIndicator = makeDim({ dimensionType: 'PROGRAM_INDICATOR' })

    it('returns columns and rows for non-aggregatable dims in PIVOT_TABLE', () => {
        expect(
            Array.from(
                getInvalidAxesForDimension(textDataElement, 'PIVOT_TABLE')
            ).sort((a, b) => a.localeCompare(b))
        ).toEqual(['columns', 'rows'])
    })

    it('returns empty set for aggregatable dims in PIVOT_TABLE', () => {
        expect(
            getInvalidAxesForDimension(numberDataElement, 'PIVOT_TABLE').size
        ).toBe(0)
        expect(
            getInvalidAxesForDimension(programIndicator, 'PIVOT_TABLE').size
        ).toBe(0)
    })

    it.each(['LINE_LIST'] as const satisfies VisualizationType[])(
        'returns empty set for non-aggregatable dims in %s',
        (visType) => {
            expect(
                getInvalidAxesForDimension(textDataElement, visType).size
            ).toBe(0)
        }
    )
})

describe('isAxisInvalidForDimension', () => {
    const textDataElement = makeDim({
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    })
    const numberDataElement = makeDim({
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    })

    it.each([
        ['columns', true],
        ['rows', true],
        ['filters', false],
    ] as const satisfies Array<[Axis, boolean]>)(
        'returns %s for non-aggregatable + PIVOT_TABLE + %s axis',
        (axis, expected) => {
            expect(
                isAxisInvalidForDimension(textDataElement, axis, 'PIVOT_TABLE')
            ).toBe(expected)
        }
    )

    it('returns false for aggregatable dim on any axis in PIVOT_TABLE', () => {
        for (const axis of ['columns', 'rows', 'filters'] as const) {
            expect(
                isAxisInvalidForDimension(
                    numberDataElement,
                    axis,
                    'PIVOT_TABLE'
                )
            ).toBe(false)
        }
    })

    it('returns false in LINE_LIST regardless of dim', () => {
        for (const axis of ['columns', 'rows', 'filters'] as const) {
            expect(
                isAxisInvalidForDimension(textDataElement, axis, 'LINE_LIST')
            ).toBe(false)
        }
    })
})
