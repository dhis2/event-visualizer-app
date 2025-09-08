import { describe, it, expect } from 'vitest'
import { getVisualizationConfig } from '@modules/get-visualization-config'

// Test cases with input and expected output
const testCases = {
    pivotTableEvent: {
        input: {
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [
                { dimension: 'dx', filter: 'EQ:dataElement1' },
                { dimension: 'pe' },
            ],
            rows: [{ dimension: 'ou' }],
            filters: [
                {
                    dimension: 'programIndicator1',
                    legendSet: { id: 'legend1' },
                    program: { id: 'program1' },
                    programStage: { id: 'stage1' },
                },
            ],
        },
        expected: {
            visualizationType: 'PIVOT_TABLE',
            inputType: 'EVENT',
            layout: {
                columns: ['dx', 'pe'],
                rows: ['ou'],
                filters: ['programIndicator1'],
            },
            itemsByDimension: {
                dx: [],
                pe: [],
                ou: [],
                programIndicator1: [],
            },
            conditionsByDimension: {
                dx: {
                    condition: 'EQ:dataElement1',
                    legendSet: undefined,
                },
                'stage1.programIndicator1': {
                    condition: undefined,
                    legendSet: 'legend1',
                },
            },
        },
    },
    lineListEnrollment: {
        input: {
            type: 'LINE_LIST',
            outputType: 'ENROLLMENT',
            columns: [{ dimension: 'enrollmentDate' }],
            rows: [{ dimension: 'ouname' }],
            filters: [
                {
                    dimension: 'dataElement1',
                    filter: 'GT:10',
                    program: { id: 'program1' },
                    programStage: { id: 'stage1' },
                },
            ],
        },
        expected: {
            visualizationType: 'LINE_LIST',
            inputType: 'ENROLLMENT',
            layout: {
                columns: ['enrollmentDate', 'ouname'],
                rows: [],
                filters: ['dataElement1'],
            },
            itemsByDimension: {
                enrollmentDate: [],
                ouname: [],
                dataElement1: [],
            },
            conditionsByDimension: {
                'stage1.dataElement1': {
                    condition: 'GT:10',
                    legendSet: undefined,
                },
            },
        },
    },
}

describe('getVisualizationConfig', () => {
    describe('basic configuration structure', () => {
        it('should return correct structure with visualizationType and inputType', () => {
            const result = getVisualizationConfig(
                testCases.pivotTableEvent.input
            )

            expect(result).toEqual(testCases.pivotTableEvent.expected)
        })

        it('should rename outputType to inputType', () => {
            const result = getVisualizationConfig(
                testCases.lineListEnrollment.input
            )

            expect(result).toEqual(testCases.lineListEnrollment.expected)
        })
    })

    describe('conditions handling', () => {
        it('should create conditions for items with filters', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [
                    { dimension: 'dx', filter: 'EQ:dataElement1' },
                    { dimension: 'pe' }, // no filter
                ],
                rows: [],
                filters: [],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty('dx')
            expect(result.conditionsByDimension.dx).toEqual({
                condition: 'EQ:dataElement1',
                legendSet: undefined,
            })
        })

        it('should create conditions for items with legendSet', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [{ dimension: 'ou', legendSet: { id: 'legend1' } }],
                rows: [],
                filters: [],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty('ou')
            expect(result.conditionsByDimension.ou).toEqual({
                condition: undefined,
                legendSet: 'legend1',
            })
        })

        it('should create full dimension IDs for items with program and programStage', () => {
            const vis = {
                type: 'LINE_LIST',
                outputType: 'ENROLLMENT',
                columns: [],
                rows: [],
                filters: [
                    {
                        dimension: 'dataElement1',
                        filter: 'GT:10',
                        program: { id: 'program1' },
                        programStage: { id: 'stage1' },
                    },
                ],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty(
                'stage1.dataElement1'
            )
            expect(result.conditionsByDimension['stage1.dataElement1']).toEqual(
                {
                    condition: 'GT:10',
                    legendSet: undefined,
                }
            )
        })

        it('should include programId in dimension ID for TRACKED_ENTITY input type', () => {
            const vis = {
                type: 'LINE_LIST',
                outputType: 'TRACKED_ENTITY',
                columns: [],
                rows: [],
                filters: [
                    {
                        dimension: 'dataElement1',
                        filter: 'LIKE:test',
                        program: { id: 'program1' },
                        programStage: { id: 'stage1' },
                    },
                ],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty(
                'program1.stage1.dataElement1'
            )
            expect(
                result.conditionsByDimension['program1.stage1.dataElement1']
            ).toEqual({
                condition: 'LIKE:test',
                legendSet: undefined,
            })
        })

        it('should not include items without filter or legendSet', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [
                    { dimension: 'dx' }, // no filter or legendSet
                    { dimension: 'pe', filter: 'EQ:202301' },
                ],
                rows: [
                    { dimension: 'ou' }, // no filter or legendSet
                ],
                filters: [],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toEqual({
                pe: { condition: 'EQ:202301', legendSet: undefined },
            })
            expect(result.conditionsByDimension).not.toHaveProperty('dx')
            expect(result.conditionsByDimension).not.toHaveProperty('ou')
        })
    })

    describe('getFullDimensionId function behavior', () => {
        it('should handle dimension with only dimensionId', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [],
                rows: [],
                filters: [
                    {
                        dimension: 'simpleId',
                        filter: 'EQ:value',
                    },
                ],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty('simpleId')
        })

        it('should handle dimension with programStageId only', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [],
                rows: [],
                filters: [
                    {
                        dimension: 'dataElement1',
                        filter: 'EQ:value',
                        programStage: { id: 'stage1' },
                    },
                ],
            }

            const result = getVisualizationConfig(vis)

            expect(result.conditionsByDimension).toHaveProperty(
                'stage1.dataElement1'
            )
        })

        it('should filter out undefined parts in dimension ID', () => {
            const vis = {
                type: 'PIVOT_TABLE',
                outputType: 'EVENT',
                columns: [],
                rows: [],
                filters: [
                    {
                        dimension: 'dataElement1',
                        filter: 'EQ:value',
                        program: { id: 'program1' }, // should be ignored for EVENT
                        programStage: { id: 'stage1' },
                    },
                ],
            }

            const result = getVisualizationConfig(vis)

            // For EVENT type, programId should not be included
            expect(result.conditionsByDimension).toHaveProperty(
                'stage1.dataElement1'
            )
            expect(result.conditionsByDimension).not.toHaveProperty(
                'program1.stage1.dataElement1'
            )
        })
    })
})
