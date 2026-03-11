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
                        dimensionId: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        dimensionId: 'bcgDoses',
                        items: [],
                    },
                    {
                        dimensionId: 'lastName',
                        items: [],
                    },
                    {
                        dimensionId: 'enrollmentDate',
                        items: [],
                    },
                    {
                        dimensionId: 'programStatus',
                        items: ['COMPLETED', 'ACTIVE'],
                    },
                    {
                        dimensionId: 'infantFeeding',
                        programStageId: 'birth',
                        items: [],
                        conditions: {
                            condition: 'IN:Exclusive;Mixed',
                        },
                    },
                    {
                        dimensionId: 'infantFeeding',
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
                        dimensionId: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        dimensionId: 'enrollmentDate',
                        items: [],
                    },
                    {
                        dimensionId: 'firstName',
                        items: [],
                        conditions: {
                            condition: 'ILIKE:je',
                        },
                    },
                    {
                        dimensionId: 'bcgDoses',
                        items: [],
                    },
                    {
                        dimensionId: 'facilityOwnership',
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
                        dimensionId: 'ou',
                        items: ['USER_ORGUNIT'],
                    },
                    {
                        dimensionId: 'focusName',
                        items: [],
                    },
                    {
                        dimensionId: 'localFocusId',
                        items: [],
                    },
                    {
                        dimensionId: 'area',
                        items: [],
                        conditions: {
                            condition: 'GT:100',
                        },
                    },
                    {
                        dimensionId: 'ou',
                        programId: 'program1Id',
                        items: ['bombali', 'bonthe', 'bo', 'kailahun'],
                    },
                    {
                        dimensionId: 'enrollmentDate',
                        programId: 'program1Id',
                        items: [],
                    },
                    {
                        dimensionId: 'focusDateOfClassification',
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
            dimensionId: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should match dimension with dimensionId and programId', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
            programId: 'program1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should match dimension with full context', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            programId: 'program1',
            programStageId: 'stage1',
            trackedEntityTypeId: 'type1',
            repetitionIndex: 0,
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
            programId: 'program1',
            programStageId: 'stage1',
            trackedEntityTypeId: 'type1',
            repetitionIndex: 0,
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })

    it('should not match when dimensionId differs', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement2',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when programId differs', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
            programId: 'program2',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when identifier has programId but dimension does not', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
            programId: 'program1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when dimension has programId but identifier does not', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            programId: 'program1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should not match when repetitionIndex differs', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            repetitionIndex: 0,
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
            repetitionIndex: 1,
        }

        expect(dimensionMatches(dimension, identifier)).toBe(false)
    })

    it('should match when both have undefined repetitionIndex', () => {
        const dimension: LayoutDimension = {
            dimensionId: 'dataElement1',
            items: [],
        }
        const identifier: DimensionIdentifier = {
            dimensionId: 'dataElement1',
        }

        expect(dimensionMatches(dimension, identifier)).toBe(true)
    })
})

describe('findDimensionInLayout', () => {
    const layout: Layout = {
        columns: [
            {
                dimensionId: 'dataElement1',
                items: ['item1'],
            },
        ],
        rows: [
            {
                dimensionId: 'dataElement2',
                programId: 'program1',
                items: ['item2'],
            },
        ],
        filters: [
            {
                dimensionId: 'dataElement1',
                programId: 'program2',
                programStageId: 'stage1',
                items: ['item3'],
            },
        ],
    }

    it('should find dimension by dimensionId only', () => {
        const result = findDimensionInLayout(layout, {
            dimensionId: 'dataElement1',
        })

        expect(result).toBeDefined()
        expect(result?.dimensionId).toBe('dataElement1')
        expect(result?.programId).toBeUndefined()
    })

    it('should find dimension by dimensionId and programId', () => {
        const result = findDimensionInLayout(layout, {
            dimensionId: 'dataElement2',
            programId: 'program1',
        })

        expect(result).toBeDefined()
        expect(result?.dimensionId).toBe('dataElement2')
        expect(result?.programId).toBe('program1')
    })

    it('should find dimension with full context', () => {
        const result = findDimensionInLayout(layout, {
            dimensionId: 'dataElement1',
            programId: 'program2',
            programStageId: 'stage1',
        })

        expect(result).toBeDefined()
        expect(result?.dimensionId).toBe('dataElement1')
        expect(result?.programId).toBe('program2')
        expect(result?.programStageId).toBe('stage1')
    })

    it('should return undefined when dimension not found', () => {
        const result = findDimensionInLayout(layout, {
            dimensionId: 'nonexistent',
        })

        expect(result).toBeUndefined()
    })

    it('should return undefined when context does not match', () => {
        const result = findDimensionInLayout(layout, {
            dimensionId: 'dataElement2',
            programId: 'wrongProgram',
        })

        expect(result).toBeUndefined()
    })

    it('should return first match when multiple exist (searches rows -> columns -> filters)', () => {
        const layoutWithDuplicates: Layout = {
            rows: [{ dimensionId: 'ou', items: [] }],
            columns: [{ dimensionId: 'ou', items: [] }],
            filters: [],
        }

        const result = findDimensionInLayout(layoutWithDuplicates, {
            dimensionId: 'ou',
        })

        expect(result).toBeDefined()
        // Should find the one in rows first based on the search order
        expect(result).toBe(layoutWithDuplicates.rows[0])
    })
})

describe('isDimensionInLayout', () => {
    const layout: Layout = {
        columns: [{ dimensionId: 'dim1', items: [] }],
        rows: [
            {
                dimensionId: 'dim2',
                programId: 'program1',
                items: [],
            },
        ],
        filters: [],
    }

    it('should return true when dimension exists', () => {
        expect(isDimensionInLayout(layout, { dimensionId: 'dim1' })).toBe(true)
    })

    it('should return true when dimension with context exists', () => {
        expect(
            isDimensionInLayout(layout, {
                dimensionId: 'dim2',
                programId: 'program1',
            })
        ).toBe(true)
    })

    it('should return false when dimension does not exist', () => {
        expect(
            isDimensionInLayout(layout, { dimensionId: 'nonexistent' })
        ).toBe(false)
    })

    it('should return false when context does not match', () => {
        expect(
            isDimensionInLayout(layout, {
                dimensionId: 'dim2',
                programId: 'wrongProgram',
            })
        ).toBe(false)
    })
})
