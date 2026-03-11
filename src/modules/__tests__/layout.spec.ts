import { describe, it, expect } from 'vitest'
import {
    formatLayoutForVisualization,
    dimensionMatches,
    findDimensionInLayout,
    isDimensionInLayout,
} from '../layout'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { Layout, LayoutDimension, DimensionIdentifier } from '@types'

const testCases = {
    lineListEnrollment: {
        outputType: 'ENROLLMENT',
        input: {
            program: { id: 'child' },
            layout: {
                columns: [
                    {
                        id: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        id: 'bcgDoses',
                        items: [],
                    },
                    {
                        id: 'lastName',
                        items: [],
                    },
                    {
                        id: 'enrollmentDate',
                        items: [],
                    },
                    {
                        id: 'programStatus',
                        items: ['COMPLETED', 'ACTIVE'],
                    },
                    {
                        id: 'infantFeeding',
                        programStageId: 'birth',
                        items: [],
                        conditions: {
                            condition: 'IN:Exclusive;Mixed',
                        },
                    },
                    {
                        id: 'infantFeeding',
                        programStageId: 'babyPostnatal',
                        items: [],
                        repetitions: {
                            mostRecent: 3,
                            oldest: 0,
                        },
                    },
                ],
                rows: [],
                filters: [],
            },
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
            layout: {
                columns: [
                    {
                        id: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        id: 'enrollmentDate',
                        items: [],
                    },
                    {
                        id: 'firstName',
                        items: [],
                        conditions: {
                            condition: 'ILIKE:je',
                        },
                    },
                    {
                        id: 'bcgDoses',
                        items: [],
                    },
                    {
                        id: 'facilityOwnership',
                        items: ['privateClinic', 'publicFacility'],
                    },
                ],
                rows: [],
                filters: [],
            },
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
            layout: {
                columns: [
                    {
                        id: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        id: 'focusName',
                        items: [],
                    },
                    {
                        id: 'localFocusId',
                        items: [],
                    },
                    {
                        id: 'area',
                        items: [],
                        conditions: {
                            condition: 'GT:100',
                        },
                    },
                    {
                        id: 'ou',
                        programId: 'program1Id',
                        items: ['bombali', 'bonthe', 'bo', 'kailahun'],
                    },
                    {
                        id: 'enrollmentDate',
                        programId: 'program1Id',
                        items: [],
                    },
                    {
                        id: 'focusDateOfClassification',
                        programId: 'program1Id',
                        programStageId: 'stage1Id',
                        items: [],
                    },
                ],
                rows: [],
                filters: [],
            },
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
        (name, { input, expected }) => {
            const result = formatLayoutForVisualization(
                input as unknown as VisUiConfigState
            )
            expect(result).toEqual(expected)
        }
    )
})

describe('dimensionMatches', () => {
    it('should match dimension with just dimensionId', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should match dimension with dimensionId and programId', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
            programId: 'program1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should match dimension with full context', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            programId: 'program1',
            programStageId: 'stage1',
            trackedEntityTypeId: 'type1',
            repetitionIndex: 0,
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
            programId: 'program1',
            programStageId: 'stage1',
            trackedEntityTypeId: 'type1',
            repetitionIndex: 0,
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should not match when dimensionId differs', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement2',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when programId differs', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
            programId: 'program2',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when identifier has programId but dimension does not', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
            programId: 'program1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when dimension has programId but identifier does not', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when repetitionIndex differs', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            repetitionIndex: 0,
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
            repetitionIndex: 1,
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should match when both have undefined repetitionIndex', () => {
        const dimension: LayoutDimension = {
            id: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            id: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })
})

describe('findDimensionInLayout', () => {
    const layout: Layout = {
        columns: [
            {
                id: 'dataElement1',
                items: ['item1'],
            },
        ],
        rows: [
            {
                id: 'dataElement2',
                programId: 'program1',
                items: ['item2'],
            },
        ],
        filters: [
            {
                id: 'dataElement1',
                programId: 'program2',
                programStageId: 'stage1',
                items: ['item3'],
            },
        ],
    }

    it('should find dimension by dimensionId only', () => {
        const result = findDimensionInLayout(layout, {
            id: 'dataElement1',
        })

        expect(result).toBeDefined()
        expect(result?.id).toBe('dataElement1')
        expect(result?.programId).toBeUndefined()
    })

    it('should find dimension by dimensionId and programId', () => {
        const result = findDimensionInLayout(layout, {
            id: 'dataElement2',
            programId: 'program1',
        })

        expect(result).toBeDefined()
        expect(result?.id).toBe('dataElement2')
        expect(result?.programId).toBe('program1')
    })

    it('should find dimension with full context', () => {
        const result = findDimensionInLayout(layout, {
            id: 'dataElement1',
            programId: 'program2',
            programStageId: 'stage1',
        })

        expect(result).toBeDefined()
        expect(result?.id).toBe('dataElement1')
        expect(result?.programId).toBe('program2')
        expect(result?.programStageId).toBe('stage1')
    })

    it('should return undefined when dimension not found', () => {
        const result = findDimensionInLayout(layout, {
            id: 'nonexistent',
        })

        expect(result).toBeUndefined()
    })

    it('should return undefined when context does not match', () => {
        const result = findDimensionInLayout(layout, {
            id: 'dataElement2',
            programId: 'wrongProgram',
        })

        expect(result).toBeUndefined()
    })

    it('should return first match when multiple exist (searches rows -> columns -> filters)', () => {
        const layoutWithDuplicates: Layout = {
            rows: [{ id: 'ou', items: [] }],
            columns: [{ id: 'ou', items: [] }],
            filters: [],
        }

        const result = findDimensionInLayout(layoutWithDuplicates, {
            id: 'ou',
        })

        expect(result).toBeDefined()
        // Should find the one in rows first based on the search order
        expect(result).toBe(layoutWithDuplicates.rows[0])
    })
})

describe('isDimensionInLayout', () => {
    const layout: Layout = {
        columns: [{ id: 'dim1', items: [] }],
        rows: [
            {
                id: 'dim2',
                programId: 'program1',
                items: [],
            },
        ],
        filters: [],
    }

    it('should return true when dimension exists', () => {
        expect(isDimensionInLayout(layout, { id: 'dim1' })).toBe(true)
    })

    it('should return true when dimension with context exists', () => {
        expect(
            isDimensionInLayout(layout, {
                id: 'dim2',
                programId: 'program1',
            })
        ).toBe(true)
    })

    it('should return false when dimension does not exist', () => {
        expect(isDimensionInLayout(layout, { id: 'nonexistent' })).toBe(false)
    })

    it('should return false when context does not match', () => {
        expect(
            isDimensionInLayout(layout, {
                id: 'dim2',
                programId: 'wrongProgram',
            })
        ).toBe(false)
    })
})
