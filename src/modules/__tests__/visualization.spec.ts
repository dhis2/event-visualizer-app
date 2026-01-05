import { describe, it, expect } from 'vitest'
import {
    getSaveableVisualization,
    getVisualizationUiConfig,
} from '../visualization'
import type { NewVisualization, SavedVisualization } from '@types'

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
                },
            ],
            filters: [],
        },
        expected: {
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
            visualizationType: 'LINE_LIST',
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
            visualizationType: 'LINE_LIST',
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
            outputType: 'EVENT',
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
                ou: ['USER_ORGUNIT'],
                focusName: [],
                localFocusId: [],
                area: [],
                'incidentDateId.ou': ['bombali', 'bonthe', 'bo', 'kailahun'],
                'incidentDateId.enrollmentDate': [],
                'incidentDateId.dateOfFociRegistrationId.focusDateOfClassification':
                    [],
            },
            conditionsByDimension: {
                area: {
                    condition: 'GT:100',
                },
            },
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'ou',
                    'focusName',
                    'localFocusId',
                    'area',
                    'incidentDateId.ou',
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
            expect(result).toEqual(expected)
        }
    )
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
            filters: [
                {
                    dimension: 'b',
                    dimensionType: 'OTHER',
                    valueType: 'NUMBER',
                },
            ],
        } as unknown as NewVisualization

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

    it('removes programStage when id is not provided', () => {
        const vis = {
            programStage: {},
            columns: [],
            filters: [],
        } as unknown as NewVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.programStage).toBeUndefined()
    })

    it('keeps programStage when id is present', () => {
        const vis = {
            programStage: { id: 'stage-1', name: 'Stage 1' },
            columns: [],
            filters: [],
        } as unknown as NewVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.programStage).toEqual({ id: 'stage-1', name: 'Stage 1' })
    })

    it('removes legacy property before saving', () => {
        const vis = {
            legacy: true,
            columns: [],
            filters: [],
        } as unknown as NewVisualization

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
            filters: [],
        } as unknown as NewVisualization

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
            filters: [],
        } as unknown as NewVisualization
        const vis2 = {
            sorting: [],
            columns: [],
            filters: [],
        } as unknown as NewVisualization

        const saved1 = getSaveableVisualization(vis1)
        const saved2 = getSaveableVisualization(vis2)

        expect(saved1.sorting).toBeUndefined()
        expect(saved2.sorting).toBeUndefined()
    })
})
