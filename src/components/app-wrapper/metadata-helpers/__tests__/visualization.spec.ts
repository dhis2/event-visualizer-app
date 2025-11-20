import { describe, it, expect } from 'vitest'
import {
    supplementDimensionMetadata,
    extractTrackedEntityTypeMetadata,
    extractFixedDimensionsMetadata,
    extractProgramDimensionsMetadata,
    extractDimensionMetadata,
    extractProgramMetadata,
} from '../visualization'
import type { SavedVisualization, DimensionRecord } from '@types'

describe('supplementDimensionMetadata', () => {
    it('should add prefixed dimension metadata for dimensions with matching metadata items', () => {
        const metadataInput = {
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
            },
            dimension2: {
                id: 'dimension2',
                name: 'Dimension Two',
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dimension1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                    optionSet: { id: 'optionSet1' },
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
                dimensionType: 'DATA_ELEMENT',
                optionSet: 'optionSet1',
                valueType: 'TEXT',
            },
            dimension2: {
                id: 'dimension2',
                name: 'Dimension Two',
            },
        })
    })

    it('should handle dimensions with program and programStage', () => {
        const metadataInput = {
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [],
            rows: [
                {
                    dimension: 'dimension1',
                    dimensionType: 'DATA_ELEMENT',
                    program: { id: 'program1' },
                    programStage: { id: 'stage1' },
                } as DimensionRecord,
            ],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
            },
            'stage1.dimension1': {
                id: 'stage1.dimension1',
                name: 'Dimension One',
                dimensionType: 'DATA_ELEMENT',
            },
        })
    })

    it('should skip dimensions without matching metadata items', () => {
        const metadataInput = {
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dimension1',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
                {
                    dimension: 'dimension2', // No matching metadata
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
                dimensionType: 'DATA_ELEMENT',
            },
        })
    })

    it('should skip user org unit metadata items', () => {
        const metadataInput = {
            ou: {
                organisationUnits: ['ou1', 'ou2'],
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'ou',
                    dimensionType: 'ORGANISATION_UNIT',
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            ou: {
                organisationUnits: ['ou1', 'ou2'],
            },
        })
    })

    it('should skip metadata items without name', () => {
        const metadataInput = {
            dimension1: {
                id: 'dimension1',
                // No name property
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dimension1',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dimension1: {
                id: 'dimension1',
            },
        })
    })

    it('should include valueType and optionSet when available', () => {
        const metadataInput = {
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
            },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dimension1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'NUMBER',
                    optionSet: { id: 'optionSet1' },
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dimension1: {
                id: 'dimension1',
                name: 'Dimension One',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
                optionSet: 'optionSet1',
            },
        })
    })

    it('should handle multiple dimensions from columns, rows, and filters', () => {
        const metadataInput = {
            dim1: { id: 'dim1', name: 'Dimension 1' },
            dim2: { id: 'dim2', name: 'Dimension 2' },
            dim3: { id: 'dim3', name: 'Dimension 3' },
        }

        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dim1',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
            rows: [
                {
                    dimension: 'dim2',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
            filters: [
                {
                    dimension: 'dim3',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
        } as unknown as SavedVisualization

        const result = supplementDimensionMetadata(metadataInput, visualization)

        expect(result).toEqual({
            dim1: {
                id: 'dim1',
                name: 'Dimension 1',
                dimensionType: 'DATA_ELEMENT',
            },
            dim2: {
                id: 'dim2',
                name: 'Dimension 2',
                dimensionType: 'DATA_ELEMENT',
            },
            dim3: {
                id: 'dim3',
                name: 'Dimension 3',
                dimensionType: 'DATA_ELEMENT',
            },
        })
    })
})

describe('extractTrackedEntityTypeMetadata', () => {
    it('should return tracked entity type metadata when trackedEntityType exists', () => {
        const visualization = {
            trackedEntityType: {
                id: 'trackedEntity1',
                name: 'Person',
            },
        } as unknown as SavedVisualization

        const result = extractTrackedEntityTypeMetadata(visualization)

        expect(result).toEqual({
            trackedEntity1: {
                id: 'trackedEntity1',
                name: 'Person',
            },
        })
    })

    it('should return empty object when trackedEntityType does not exist', () => {
        const visualization = {} as SavedVisualization

        const result = extractTrackedEntityTypeMetadata(visualization)

        expect(result).toEqual({})
    })
})

describe('extractFixedDimensionsMetadata', () => {
    it('should return fixed dimensions metadata for TRACKED_ENTITY_INSTANCE with ou dimension', () => {
        const visualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE' as const,
            columns: [
                {
                    dimension: 'ou',
                    dimensionType: 'ORGANISATION_UNIT',
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = extractFixedDimensionsMetadata(visualization)

        expect(result).toHaveProperty('ou')
        expect(result.ou).toHaveProperty('id', 'ou')
        expect(result.ou).toHaveProperty('dimensionType', 'ORGANISATION_UNIT')
    })

    it('should return empty object when no fixed dimensions match', () => {
        const visualization = {
            outputType: 'EVENT' as const,
            columns: [
                {
                    dimension: 'dataElement1',
                    dimensionType: 'DATA_ELEMENT',
                } as DimensionRecord,
            ],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const result = extractFixedDimensionsMetadata(visualization)

        expect(result).toEqual({})
    })
})

describe('extractProgramDimensionsMetadata', () => {
    it('should return program dimensions metadata for EVENT outputType', () => {
        const visualization = {
            outputType: 'EVENT' as const,
            programDimensions: [
                {
                    id: 'program1',
                    name: 'Program 1',
                    programStages: [
                        {
                            id: 'stage1',
                            name: 'Stage 1',
                        },
                    ],
                },
            ],
        } as unknown as SavedVisualization

        const result = extractProgramDimensionsMetadata(visualization)

        expect(result).toHaveProperty('program1')
        expect(result).toHaveProperty('stage1')
    })

    it('should return empty object for TRACKED_ENTITY_INSTANCE outputType', () => {
        const visualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE' as const,
            programDimensions: [
                {
                    id: 'program1',
                    name: 'Program 1',
                },
            ],
        } as unknown as SavedVisualization

        const result = extractProgramDimensionsMetadata(visualization)

        expect(result).toEqual({})
    })
})

describe('extractDimensionMetadata', () => {
    it('should return dimension metadata from dataElementDimensions', () => {
        const visualization = {
            dataElementDimensions: [
                {
                    dataElement: {
                        id: 'dataElement1',
                        name: 'Data Element 1',
                    },
                },
            ],
        } as unknown as SavedVisualization

        const result = extractDimensionMetadata(visualization)

        expect(result).toHaveProperty('dataElement1')
        expect(result.dataElement1).toHaveProperty('id', 'dataElement1')
        expect(result.dataElement1).toHaveProperty('name', 'Data Element 1')
    })

    it('should return empty object when no dimensions exist', () => {
        const visualization = {} as SavedVisualization

        const result = extractDimensionMetadata(visualization)

        expect(result).toEqual({})
    })
})

describe('extractProgramMetadata', () => {
    it('should return program and programStage metadata when both exist', () => {
        const visualization = {
            program: {
                id: 'program1',
                name: 'Program 1',
            },
            programStage: {
                id: 'stage1',
                name: 'Stage 1',
            },
        } as unknown as SavedVisualization

        const result = extractProgramMetadata(visualization)

        expect(result).toEqual({
            program1: {
                id: 'program1',
                name: 'Program 1',
            },
            stage1: {
                id: 'stage1',
                name: 'Stage 1',
            },
        })
    })

    it('should return only program metadata when programStage does not exist', () => {
        const visualization = {
            program: {
                id: 'program1',
                name: 'Program 1',
            },
        } as unknown as SavedVisualization

        const result = extractProgramMetadata(visualization)

        expect(result).toEqual({
            program1: {
                id: 'program1',
                name: 'Program 1',
            },
        })
    })

    it('should return empty object when neither program nor programStage exist', () => {
        const visualization = {} as SavedVisualization

        const result = extractProgramMetadata(visualization)

        expect(result).toEqual({})
    })
})
