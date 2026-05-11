import { DEFAULT_OPTIONS } from '@constants/options'
import type { CurrentVisualization, SavedVisualization } from '@types'
import { describe, it, expect } from 'vitest'
import {
    analyticsHeaderToCanonicalDimensionId,
    getAnalyticsRequestDimensionName,
    getAnalyticsRequestHeaderName,
    getSaveableVisualization,
    getVisualizationUiConfig,
} from '../visualization'

const testCases = {
    lineListEnrollment: {
        input: {
            type: 'LINE_LIST',
            outputType: 'ENROLLMENT',
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PROGRAM_INDICATOR',
                    items: [],
                    dimension: 'bcgDoses',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'lastName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'DATA_X',
                    items: [
                        {
                            id: 'COMPLETED',
                        },
                        {
                            id: 'ACTIVE',
                        },
                    ],
                    dimension: 'programStatus',
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'birth',
                    },
                    program: {
                        id: 'IpHINAT79UW',
                    },
                    filter: 'IN:Exclusive;Mixed',
                    dimension: 'infantFeeding',
                    valueType: 'TEXT',
                    optionSet: {
                        id: 'x31y45jvIQL',
                    },
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'babyPostnatal',
                    },
                    program: {
                        id: 'IpHINAT79UW',
                    },
                    dimension: 'infantFeeding',
                    valueType: 'TEXT',
                    optionSet: {
                        id: 'x31y45jvIQL',
                    },
                    repetition: {
                        indexes: [-2, -1, 0],
                    },
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                enrollmentOu: ['USER_ORGUNIT'],
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
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'enrollmentOu',
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
            outputType: 'ENROLLMENT',
        },
    },
    lineListEvent: {
        input: {
            type: 'LINE_LIST',
            outputType: 'EVENT',
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    filter: 'ILIKE:je',
                    dimension: 'firstName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_INDICATOR',
                    items: [],
                    dimension: 'bcgDoses',
                },
                {
                    dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                    items: [
                        {
                            id: 'privateClinic',
                        },
                        {
                            id: 'publicFacility',
                        },
                    ],
                    dimension: 'facilityOwnership',
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                enrollmentOu: ['USER_ORGUNIT'],
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
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'enrollmentOu',
                    'enrollmentDate',
                    'firstName',
                    'bcgDoses',
                    'facilityOwnership',
                ],
                rows: [],
                filters: [],
            },
            outputType: 'EVENT',
            lastActiveButton: 'EVENT',
        },
    },
    lineListTrackedEntity: {
        input: {
            type: 'LINE_LIST',
            outputType: 'TRACKED_ENTITY_INSTANCE',
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'focusName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'localFocusId',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    filter: 'GT:100',
                    dimension: 'area',
                    valueType: 'NUMBER',
                },
                {
                    dimensionType: 'ORGANISATION_UNIT',
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
                        id: 'incidentDateId',
                    },
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    program: {
                        id: 'incidentDateId',
                    },
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'dateOfFociRegistrationId',
                    },
                    program: {
                        id: 'incidentDateId',
                    },
                    dimension: 'focusDateOfClassification',
                    valueType: 'DATE',
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                enrollmentOu: ['USER_ORGUNIT'],
                focusName: [],
                localFocusId: [],
                area: [],
                'incidentDateId.enrollmentOu': [
                    'bombali',
                    'bonthe',
                    'bo',
                    'kailahun',
                ],
                'incidentDateId.enrollmentDate': [],
                'incidentDateId.dateOfFociRegistrationId.focusDateOfClassification':
                    [],
            },
            conditionsByDimension: {
                area: {
                    condition: 'GT:100',
                },
            },
            repetitionsByDimension: {},
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'enrollmentOu',
                    'focusName',
                    'localFocusId',
                    'area',
                    'incidentDateId.enrollmentOu',
                    'incidentDateId.enrollmentDate',
                    'incidentDateId.dateOfFociRegistrationId.focusDateOfClassification',
                ],
                rows: [],
                filters: [],
            },
            outputType: 'TRACKED_ENTITY_INSTANCE',
        },
    },
}

describe('getVisualizationUiConfig', () => {
    it.each(Object.entries(testCases))(
        'should return correct config for %s visualization',
        (name, { input, expected }) => {
            const result = getVisualizationUiConfig(
                input as unknown as SavedVisualization
            )
            expect(result).toEqual({ ...expected, options: DEFAULT_OPTIONS })
        }
    )

    it('extracts option fields from the saved vis and overrides the base options', () => {
        const input = {
            type: 'LINE_LIST',
            outputType: 'EVENT',
            rows: [],
            columns: [],
            filters: [],
            hideTitle: true,
            title: 'My Saved Title',
            fontSize: 'LARGE',
        } as unknown as SavedVisualization

        const baseOptions = {
            ...DEFAULT_OPTIONS,
            digitGroupSeparator: 'COMMA' as const,
            hideTitle: false,
        }

        const result = getVisualizationUiConfig(input, baseOptions)

        expect(result.options).toEqual({
            ...baseOptions,
            hideTitle: true,
            title: 'My Saved Title',
            fontSize: 'LARGE',
        })
    })
})

describe('getSaveableVisualization', () => {
    it('strips dimensionType and valueType from columns and filters', () => {
        const vis = {
            columns: [
                {
                    dimension: 'a',
                    dimensionType: 'SOME_TYPE',
                    valueType: 'TEXT',
                },
            ],
            rows: [],
            filters: [
                {
                    dimension: 'b',
                    dimensionType: 'OTHER',
                    valueType: 'NUMBER',
                },
            ],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)

        expect(saved.columns).toBeDefined()
        const col0 = (saved.columns as Array<Record<string, unknown>>)[0]
        expect(col0.dimension).toBe('a')
        expect('dimensionType' in col0).toBe(false)
        expect('valueType' in col0).toBe(false)

        expect(saved.filters).toBeDefined()
        const filt0 = (saved.filters as Array<Record<string, unknown>>)[0]
        expect(filt0.dimension).toBe('b')
        expect('dimensionType' in filt0).toBe(false)
        expect('valueType' in filt0).toBe(false)
    })

    it('removes legacy property before saving', () => {
        const vis = {
            legacy: true,
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)
        expect('legacy' in (saved as Record<string, unknown>)).toBe(false)
    })

    it('uses only the first sorting item and uppercases the direction', () => {
        const vis = {
            sorting: [
                { dimension: 'someDim', direction: 'desc' },
                { dimension: 'other', direction: 'asc' },
            ],
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.sorting).toBeDefined()
        expect(saved.sorting as Array<Record<string, unknown>>).toHaveLength(1)
        const s0 = (saved.sorting as Array<Record<string, unknown>>)[0]
        expect(s0.dimension).toBe('someDim')
        expect(s0.direction).toBe('DESC')
    })

    it('sets sorting to undefined when sorting is not provided or empty', () => {
        const vis1 = {
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization
        const vis2 = {
            sorting: [],
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved1 = getSaveableVisualization(vis1)
        const saved2 = getSaveableVisualization(vis2)

        expect(saved1.sorting).toBeUndefined()
        expect(saved2.sorting).toBeUndefined()
    })
})

describe('analyticsHeaderToCanonicalDimensionId', () => {
    const PROGRAM_ID = 'IpHINAT79UW'
    const STAGE_ID = 'A03MvHHogjR'
    const TET_ID = 'nEenWmSyUEp'

    const buildVis = (
        overrides: Partial<CurrentVisualization> = {}
    ): CurrentVisualization =>
        ({
            type: 'LINE_LIST',
            outputType: 'EVENT',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [{ id: PROGRAM_ID, programStages: [] }],
            ...overrides,
        }) as unknown as CurrentVisualization

    describe('stage-prefixed dimensions (any outputType)', () => {
        it.each(['EVENT', 'ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'] as const)(
            'preserves stage prefix for `%s.ouname` (stage event OU) in %s',
            (outputType) => {
                const vis = buildVis({ outputType })
                expect(
                    analyticsHeaderToCanonicalDimensionId(
                        `${STAGE_ID}.ouname`,
                        vis
                    )
                ).toBe(`${STAGE_ID}.ou`)
            }
        )

        it('reverses the wire `eventdate` to canonical `eventDate` under a stage prefix', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    `${STAGE_ID}.eventdate`,
                    buildVis()
                )
            ).toBe(`${STAGE_ID}.eventDate`)
        })

        it('leaves a stage-prefixed data element wire ID untouched', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    `${STAGE_ID}.a3kGcGDCuk6`,
                    buildVis()
                )
            ).toBe(`${STAGE_ID}.a3kGcGDCuk6`)
        })
    })

    describe('enrollment-scoped dimensions', () => {
        it('injects programId for bare `enrollmentouname` in EVENT', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    'enrollmentouname',
                    buildVis({ outputType: 'EVENT' })
                )
            ).toBe(`${PROGRAM_ID}.enrollmentOu`)
        })

        it('injects programId for bare `ouname` in ENROLLMENT (ENR override)', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    'ouname',
                    buildVis({ outputType: 'ENROLLMENT' })
                )
            ).toBe(`${PROGRAM_ID}.enrollmentOu`)
        })

        it.each(['enrollmentdate', 'incidentdate', 'programstatus'])(
            'injects programId for bare `%s` in EVENT',
            (wireDim) => {
                const expectedAppLocal = {
                    enrollmentdate: 'enrollmentDate',
                    incidentdate: 'incidentDate',
                    programstatus: 'programStatus',
                }[wireDim]
                expect(
                    analyticsHeaderToCanonicalDimensionId(
                        wireDim,
                        buildVis({ outputType: 'EVENT' })
                    )
                ).toBe(`${PROGRAM_ID}.${expectedAppLocal}`)
            }
        )

        it('preserves the program prefix on TE `programId.enrollmentouname`', () => {
            const vis = buildVis({
                outputType: 'TRACKED_ENTITY_INSTANCE',
                trackedEntityType: { id: TET_ID, name: 'Person' },
            })
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    `${PROGRAM_ID}.enrollmentouname`,
                    vis
                )
            ).toBe(`${PROGRAM_ID}.enrollmentOu`)
        })
    })

    describe('TE registration scope', () => {
        const teVis = () =>
            buildVis({
                outputType: 'TRACKED_ENTITY_INSTANCE',
                trackedEntityType: { id: TET_ID, name: 'Person' },
            })

        it('rewrites bare `ouname` to `tetId.enrollmentOu`', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId('ouname', teVis())
            ).toBe(`${TET_ID}.enrollmentOu`)
        })

        it('rewrites bare `created` to `tetId.created`', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId('created', teVis())
            ).toBe(`${TET_ID}.created`)
        })

        it('returns plain `lastUpdated` for bare `lastupdated` in TE', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId('lastupdated', teVis())
            ).toBe('lastUpdated')
        })
    })

    describe('plain wire IDs', () => {
        it.each([
            ['lastupdated', 'lastUpdated'],
            ['createdbydisplayname', 'createdBy'],
            ['lastupdatedbydisplayname', 'lastUpdatedBy'],
            ['created', 'created'],
            ['completed', 'completed'],
        ])(
            'reverses `%s` → `%s` with no prefix in EVENT',
            (wire, canonical) => {
                expect(
                    analyticsHeaderToCanonicalDimensionId(wire, buildVis())
                ).toBe(canonical)
            }
        )

        it('passes through unknown plain IDs (program indicators, TEAs)', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId('p2Zxg0wcPQ3', buildVis())
            ).toBe('p2Zxg0wcPQ3')
            expect(
                analyticsHeaderToCanonicalDimensionId('cejWyOfXge6', buildVis())
            ).toBe('cejWyOfXge6')
        })
    })

    describe('showHierarchy', () => {
        it('reverses `ounamehierarchy` back to `ou` under a stage prefix', () => {
            expect(
                analyticsHeaderToCanonicalDimensionId(
                    `${STAGE_ID}.ounamehierarchy`,
                    buildVis({ showHierarchy: true })
                )
            ).toBe(`${STAGE_ID}.ou`)
        })
    })
})

/* Wire request format reference (from the Tracker analytics spec).
 * Each row pairs the canonical store entry (id + dimensionId + qualifiers)
 * with the expected `?dimension=` and `?headers=` wire forms across the four
 * line-list query modes. The aggregate (PIVOT_TABLE) query modes use the same
 * wire forms per the spec, so they're not duplicated here. */
const PROGRAM_ID = 'IpHINAT79UW'
const STAGE_ID = 'A03MvHHogjR'
const TET_ID = 'nEenWmSyUEp'
const DE_ID = 'a3kGcGDCuk6'
const TEA_ID = 'cejWyOfXge6'
const PI_ID = 'p2Zxg0wcPQ3'
const OUGS_ID = 'uIuxlbV1vRT'

type WireRow = {
    label: string
    dim: {
        dimensionId: string
        programId?: string
        programStageId?: string
        trackedEntityTypeId?: string
    }
    request: string
    header: string
}

const eventQueryRows: WireRow[] = [
    {
        label: 'stage event OU',
        dim: { dimensionId: 'ou', programStageId: STAGE_ID },
        request: `${STAGE_ID}.ou`,
        header: `${STAGE_ID}.ouname`,
    },
    {
        label: 'stage event date',
        dim: { dimensionId: 'eventDate', programStageId: STAGE_ID },
        request: `${STAGE_ID}.EVENT_DATE`,
        header: `${STAGE_ID}.eventdate`,
    },
    {
        label: 'stage scheduled date',
        dim: { dimensionId: 'scheduledDate', programStageId: STAGE_ID },
        request: `${STAGE_ID}.SCHEDULED_DATE`,
        header: `${STAGE_ID}.scheduleddate`,
    },
    {
        label: 'stage event status',
        dim: { dimensionId: 'eventStatus', programStageId: STAGE_ID },
        request: `${STAGE_ID}.EVENT_STATUS`,
        header: `${STAGE_ID}.eventstatus`,
    },
    {
        label: 'stage data element',
        dim: { dimensionId: DE_ID, programStageId: STAGE_ID },
        request: `${STAGE_ID}.${DE_ID}`,
        header: `${STAGE_ID}.${DE_ID}`,
    },
    {
        label: 'enrollment OU',
        dim: { dimensionId: 'enrollmentOu', programId: PROGRAM_ID },
        request: 'ENROLLMENT_OU',
        header: 'enrollmentouname',
    },
    {
        label: 'enrollment date',
        dim: { dimensionId: 'enrollmentDate', programId: PROGRAM_ID },
        request: 'ENROLLMENT_DATE',
        header: 'enrollmentdate',
    },
    {
        label: 'incident date',
        dim: { dimensionId: 'incidentDate', programId: PROGRAM_ID },
        request: 'INCIDENT_DATE',
        header: 'incidentdate',
    },
    {
        label: 'program status',
        dim: { dimensionId: 'programStatus', programId: PROGRAM_ID },
        request: 'PROGRAM_STATUS',
        header: 'programstatus',
    },
    {
        label: 'last updated',
        dim: { dimensionId: 'lastUpdated' },
        request: 'LAST_UPDATED',
        header: 'lastupdated',
    },
    {
        label: 'created',
        dim: { dimensionId: 'created' },
        request: 'CREATED',
        header: 'created',
    },
    {
        label: 'attribute (TEA)',
        dim: { dimensionId: TEA_ID },
        request: TEA_ID,
        header: TEA_ID,
    },
    {
        label: 'program indicator',
        dim: { dimensionId: PI_ID },
        request: PI_ID,
        header: PI_ID,
    },
    {
        label: 'OUGS',
        dim: { dimensionId: OUGS_ID },
        request: OUGS_ID,
        header: OUGS_ID,
    },
]

const enrollmentQueryRows: WireRow[] = [
    {
        label: 'stage event OU',
        dim: { dimensionId: 'ou', programStageId: STAGE_ID },
        request: `${STAGE_ID}.ou`,
        header: `${STAGE_ID}.ouname`,
    },
    {
        label: 'stage event date',
        dim: { dimensionId: 'eventDate', programStageId: STAGE_ID },
        request: `${STAGE_ID}.EVENT_DATE`,
        header: `${STAGE_ID}.eventdate`,
    },
    {
        label: 'enrollment OU (bare `ou` / `ouname`)',
        dim: { dimensionId: 'enrollmentOu', programId: PROGRAM_ID },
        request: 'ou',
        header: 'ouname',
    },
    {
        label: 'enrollment date',
        dim: { dimensionId: 'enrollmentDate', programId: PROGRAM_ID },
        request: 'ENROLLMENT_DATE',
        header: 'enrollmentdate',
    },
    {
        label: 'program status',
        dim: { dimensionId: 'programStatus', programId: PROGRAM_ID },
        request: 'PROGRAM_STATUS',
        header: 'programstatus',
    },
    {
        label: 'last updated',
        dim: { dimensionId: 'lastUpdated' },
        request: 'LAST_UPDATED',
        header: 'lastupdated',
    },
    {
        label: 'attribute (TEA)',
        dim: { dimensionId: TEA_ID },
        request: TEA_ID,
        header: TEA_ID,
    },
]

const trackedEntityQueryRows: WireRow[] = [
    {
        label: 'stage event OU',
        dim: { dimensionId: 'ou', programStageId: STAGE_ID },
        request: `${STAGE_ID}.ou`,
        header: `${STAGE_ID}.ouname`,
    },
    {
        label: 'stage event date',
        dim: { dimensionId: 'eventDate', programStageId: STAGE_ID },
        request: `${STAGE_ID}.EVENT_DATE`,
        header: `${STAGE_ID}.eventdate`,
    },
    {
        label: 'stage data element',
        dim: { dimensionId: DE_ID, programStageId: STAGE_ID },
        request: `${STAGE_ID}.${DE_ID}`,
        header: `${STAGE_ID}.${DE_ID}`,
    },
    {
        label: 'enrollment OU (program-prefixed)',
        dim: { dimensionId: 'enrollmentOu', programId: PROGRAM_ID },
        request: `${PROGRAM_ID}.ENROLLMENT_OU`,
        header: `${PROGRAM_ID}.enrollmentouname`,
    },
    {
        label: 'enrollment date (program-prefixed)',
        dim: { dimensionId: 'enrollmentDate', programId: PROGRAM_ID },
        request: `${PROGRAM_ID}.ENROLLMENT_DATE`,
        header: `${PROGRAM_ID}.enrollmentdate`,
    },
    {
        label: 'program status (program-prefixed)',
        dim: { dimensionId: 'programStatus', programId: PROGRAM_ID },
        request: `${PROGRAM_ID}.PROGRAM_STATUS`,
        header: `${PROGRAM_ID}.programstatus`,
    },
    {
        label: 'last updated (bare)',
        dim: { dimensionId: 'lastUpdated' },
        request: 'LAST_UPDATED',
        header: 'lastupdated',
    },
    {
        label: 'TEI registration OU (bare `ou`/`ouname`)',
        dim: { dimensionId: 'enrollmentOu', trackedEntityTypeId: TET_ID },
        request: 'ou',
        header: 'ouname',
    },
    {
        label: 'TEI registration date (bare `CREATED`/`created`)',
        dim: { dimensionId: 'created', trackedEntityTypeId: TET_ID },
        request: 'CREATED',
        header: 'created',
    },
    {
        label: 'attribute (plain UID)',
        dim: { dimensionId: TEA_ID },
        request: TEA_ID,
        header: TEA_ID,
    },
]

describe('getAnalyticsRequestDimensionName', () => {
    const cases: Array<
        ['EVENT' | 'ENROLLMENT' | 'TRACKED_ENTITY_INSTANCE', WireRow[]]
    > = [
        ['EVENT', eventQueryRows],
        ['ENROLLMENT', enrollmentQueryRows],
        ['TRACKED_ENTITY_INSTANCE', trackedEntityQueryRows],
    ]

    for (const [outputType, rows] of cases) {
        describe(`${outputType} query`, () => {
            for (const row of rows) {
                it(`${row.label}: produces "${row.request}"`, () => {
                    expect(
                        getAnalyticsRequestDimensionName({
                            ...row.dim,
                            outputType,
                        })
                    ).toBe(row.request)
                })
            }
        })
    }
})

describe('getAnalyticsRequestHeaderName', () => {
    const baseVis = (
        outputType: 'EVENT' | 'ENROLLMENT' | 'TRACKED_ENTITY_INSTANCE',
        overrides: Partial<CurrentVisualization> = {}
    ) =>
        ({
            type: 'LINE_LIST',
            outputType,
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [{ id: PROGRAM_ID, programStages: [] }],
            trackedEntityType:
                outputType === 'TRACKED_ENTITY_INSTANCE'
                    ? { id: TET_ID, name: 'Person' }
                    : undefined,
            ...overrides,
        }) as unknown as CurrentVisualization

    const cases: Array<
        ['EVENT' | 'ENROLLMENT' | 'TRACKED_ENTITY_INSTANCE', WireRow[]]
    > = [
        ['EVENT', eventQueryRows],
        ['ENROLLMENT', enrollmentQueryRows],
        ['TRACKED_ENTITY_INSTANCE', trackedEntityQueryRows],
    ]

    for (const [outputType, rows] of cases) {
        describe(`${outputType} query`, () => {
            for (const row of rows) {
                it(`${row.label}: produces "${row.header}"`, () => {
                    expect(
                        getAnalyticsRequestHeaderName({
                            ...row.dim,
                            visualization: baseVis(outputType),
                        })
                    ).toBe(row.header)
                })
            }
        })
    }

    it('honours showHierarchy by emitting `ounamehierarchy` for stage event OU', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'ou',
                programStageId: STAGE_ID,
                visualization: baseVis('EVENT', { showHierarchy: true }),
            })
        ).toBe(`${STAGE_ID}.ounamehierarchy`)
    })
})

describe('analyticsHeaderToCanonicalDimensionId round-trips with getAnalyticsRequestHeaderName', () => {
    const buildVisFor = (
        outputType: 'EVENT' | 'ENROLLMENT' | 'TRACKED_ENTITY_INSTANCE',
        dim: WireRow['dim']
    ) =>
        ({
            type: 'LINE_LIST',
            outputType,
            columns: [],
            rows: [],
            filters: [],
            programDimensions: dim.programId
                ? [{ id: dim.programId, programStages: [] }]
                : [{ id: PROGRAM_ID, programStages: [] }],
            trackedEntityType:
                outputType === 'TRACKED_ENTITY_INSTANCE'
                    ? { id: dim.trackedEntityTypeId ?? TET_ID, name: 'Person' }
                    : undefined,
        }) as unknown as CurrentVisualization

    const canonicalId = (dim: WireRow['dim']): string => {
        if (dim.programStageId) {
            return `${dim.programStageId}.${dim.dimensionId}`
        }
        if (dim.programId) {
            return `${dim.programId}.${dim.dimensionId}`
        }
        if (dim.trackedEntityTypeId) {
            return `${dim.trackedEntityTypeId}.${dim.dimensionId}`
        }
        return dim.dimensionId
    }

    const cases: Array<
        ['EVENT' | 'ENROLLMENT' | 'TRACKED_ENTITY_INSTANCE', WireRow[]]
    > = [
        ['EVENT', eventQueryRows],
        ['ENROLLMENT', enrollmentQueryRows],
        ['TRACKED_ENTITY_INSTANCE', trackedEntityQueryRows],
    ]

    for (const [outputType, rows] of cases) {
        describe(`${outputType} query`, () => {
            for (const row of rows) {
                it(`${row.label}: header → canonical matches`, () => {
                    const vis = buildVisFor(outputType, row.dim)
                    expect(
                        analyticsHeaderToCanonicalDimensionId(row.header, vis)
                    ).toBe(canonicalId(row.dim))
                })
            }
        })
    }
})
