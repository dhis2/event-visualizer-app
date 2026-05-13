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

const PID = 'pid'
const SID = 'sid'
const TET = 'tet'
const UID = 'a3kGcGDCuk6'

const buildVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        programDimensions: [{ id: PID, programStages: [] }],
        ...overrides,
    }) as unknown as CurrentVisualization

describe('analyticsHeaderToCanonicalDimensionId', () => {
    it('preserves a stage prefix (any outputType)', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}.eventdate`,
                buildVis()
            )
        ).toBe(`${SID}.eventDate`)
    })

    it('rewrites bare `ou` to `tetId.enrollmentOu` in TE', () => {
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET, name: 'Person' },
        })
        expect(analyticsHeaderToCanonicalDimensionId('ouname', vis)).toBe(
            `${TET}.enrollmentOu`
        )
    })

    it('rewrites bare `created` to `tetId.created` in TE', () => {
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET, name: 'Person' },
        })
        expect(analyticsHeaderToCanonicalDimensionId('created', vis)).toBe(
            `${TET}.created`
        )
    })

    it('returns plain for other bare wire dims in TE', () => {
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET, name: 'Person' },
        })
        expect(analyticsHeaderToCanonicalDimensionId('lastupdated', vis)).toBe(
            'lastUpdated'
        )
    })

    it('injects programId for bare `ou` in ENR', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                'ouname',
                buildVis({ outputType: 'ENROLLMENT' })
            )
        ).toBe(`${PID}.enrollmentOu`)
    })

    it('injects programId for bare enrollment-scoped dims in EVENT', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId('enrollmentdate', buildVis())
        ).toBe(`${PID}.enrollmentDate`)
    })

    it('returns plain for non-enrollment-scoped bare dims', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId('lastupdated', buildVis())
        ).toBe('lastUpdated')
        expect(analyticsHeaderToCanonicalDimensionId(UID, buildVis())).toBe(UID)
    })

    it('reverses `ounamehierarchy` to `ou`', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}.ounamehierarchy`,
                buildVis()
            )
        ).toBe(`${SID}.ou`)
    })
})

describe('getAnalyticsRequestDimensionName', () => {
    it('prefixes stage and SCREAMING_SNAKE-cases known dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'eventDate',
                programStageId: SID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}.EVENT_DATE`)
    })

    it('prefixes stage and leaves UIDs alone', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}.${UID}`)
    })

    it('rewrites TE registration `enrollmentOu` to bare `ou`', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                trackedEntityTypeId: TET,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe('ou')
    })

    it('emits bare SCREAMING_SNAKE for other TE registration dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'created',
                trackedEntityTypeId: TET,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe('CREATED')
    })

    it('prefixes programId for enrollment-scoped dims in TE', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe(`${PID}.ENROLLMENT_OU`)
    })

    it('rewrites ENR `enrollmentOu` to bare `ou`', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                outputType: 'ENROLLMENT',
            })
        ).toBe('ou')
    })

    it('emits bare SCREAMING_SNAKE for enrollment-scoped dims in EVENT', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentDate',
                programId: PID,
                outputType: 'EVENT',
            })
        ).toBe('ENROLLMENT_DATE')
    })

    it('returns plain UID for unprefixed UID dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                outputType: 'EVENT',
            })
        ).toBe(UID)
    })
})

describe('getAnalyticsRequestHeaderName', () => {
    it('prefixes stage with lowercase wire dim', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'eventDate',
                programStageId: SID,
                visualization: buildVis(),
            })
        ).toBe(`${SID}.eventdate`)
    })

    it('rewrites TE registration `enrollmentOu` to bare `ouname`', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                trackedEntityTypeId: TET,
                visualization: buildVis({
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    trackedEntityType: { id: TET, name: 'Person' },
                }),
            })
        ).toBe('ouname')
    })

    it('prefixes programId for enrollment-scoped dims in TE', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentDate',
                programId: PID,
                visualization: buildVis({
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                }),
            })
        ).toBe(`${PID}.enrollmentdate`)
    })

    it('uses ENR override mapping `enrollmentOu` to `ouname`', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                visualization: buildVis({ outputType: 'ENROLLMENT' }),
            })
        ).toBe('ouname')
    })

    it('emits bare lowercase for enrollment-scoped dims in EVENT', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                visualization: buildVis(),
            })
        ).toBe('enrollmentouname')
    })

    it('returns plain UID for plain UID dims', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: UID,
                visualization: buildVis(),
            })
        ).toBe(UID)
    })

    it('emits `ounamehierarchy` for stage `ou` when showHierarchy is on', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'ou',
                programStageId: SID,
                visualization: buildVis({ showHierarchy: true }),
            })
        ).toBe(`${SID}.ounamehierarchy`)
    })
})
