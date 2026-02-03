import { expect, it, describe } from 'vitest'
import { extractDataSourceIdFromVisualization } from '../data-source'
import type { CurrentVisualization } from '@types'

describe('extractDataSourceIdFromVisualization', () => {
    it('should return program.id for outputType ENROLLMENT when program.id is present', () => {
        const visualization: CurrentVisualization = {
            outputType: 'ENROLLMENT',
            type: 'LINE_LIST',
            program: {
                id: 'program1',
                name: 'Program 1',
                programType: 'WITH_REGISTRATION',
                programStages: [],
            },
            programDimensions: [],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'program1'
        )
    })

    it('should return program.id for outputType EVENT when program.id is present', () => {
        const visualization: CurrentVisualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
            program: {
                id: 'program2',
                name: 'Program 2',
                programType: 'WITHOUT_REGISTRATION',
                programStages: [],
            },
            programDimensions: [],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'program2'
        )
    })

    it('should throw error for outputType ENROLLMENT when program.id is missing', () => {
        const visualization: CurrentVisualization = {
            outputType: 'ENROLLMENT',
            type: 'LINE_LIST',
            program: {
                id: '',
                name: 'Program',
                programType: 'WITH_REGISTRATION',
                programStages: [],
            },
            programDimensions: [],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })

    it('should throw error for outputType EVENT when program.id is missing', () => {
        const visualization: CurrentVisualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })

    it('should return first programDimensions.id for outputType TRACKED_ENTITY_INSTANCE with single programDimension', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [
                {
                    id: 'prog1',
                    name: 'Program A',
                    programType: 'WITH_REGISTRATION',
                    programStages: [],
                },
            ],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'prog1'
        )
    })

    it('should return sorted first programDimensions.id for outputType TRACKED_ENTITY_INSTANCE with multiple programDimensions', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [
                {
                    id: 'prog2',
                    name: 'Program B',
                    programType: 'WITH_REGISTRATION',
                    programStages: [],
                },
                {
                    id: 'prog1',
                    name: 'Program A',
                    programType: 'WITH_REGISTRATION',
                    programStages: [],
                },
            ],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'prog1'
        ) // 'Program A' comes first alphabetically
    })

    it('should return trackedEntityType.id for outputType TRACKED_ENTITY_INSTANCE when programDimensions is empty', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [],
            trackedEntityType: { id: 'tet1', name: 'TET 1' },
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe('tet1')
    })

    it('should throw error for outputType TRACKED_ENTITY_INSTANCE when programDimensions is empty and trackedEntityType.id is missing', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [],
            trackedEntityType: { id: '', name: 'TET' },
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })

    it('should throw error for outputType TRACKED_ENTITY_INSTANCE when programDimensions has items but first has no id', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            program: undefined,
            programDimensions: [
                {
                    id: '',
                    name: 'Program A',
                    programType: 'WITH_REGISTRATION',
                    programStages: [],
                },
            ],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })
})
