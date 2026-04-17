import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { formatLayoutForVisualization } from '../layout'

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

describe('formatLayoutForVisualization', () => {
    it.each(Object.entries(testCases))(
        'should return correct columns/rows/filters from visUiConfig %s layout',
        (_name, { input, metadata, expected }) => {
            const getDimension = (id: string) =>
                (metadata as Record<string, DimensionMetadataItem>)[id]
            const result = formatLayoutForVisualization(
                input as unknown as VisUiConfigState,
                getDimension
            )
            expect(result).toEqual(expected)
        }
    )
})
