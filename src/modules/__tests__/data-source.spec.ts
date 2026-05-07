import type { CurrentVisualization, Program } from '@types'
import { expect, it, describe } from 'vitest'
import { extractDataSourceIdFromVisualization } from '../data-source'

const makeProgram = (
    overrides: Partial<Program> & Pick<Program, 'id'>
): Program => ({
    name: `Program ${overrides.id}`,
    programType: 'WITH_REGISTRATION',
    programStages: [],
    trackedEntityType: {
        id: `tet-${overrides.id}`,
        name: `Tracked Entity Type ${overrides.id}`,
    },
    ...overrides,
})

describe('extractDataSourceIdFromVisualization', () => {
    it('should return the program id for outputType ENROLLMENT when exactly one program is in programDimensions', () => {
        const visualization: CurrentVisualization = {
            outputType: 'ENROLLMENT',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [makeProgram({ id: 'program1' })],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'program1'
        )
    })

    it('should return the program id for outputType EVENT when exactly one program is in programDimensions', () => {
        const visualization: CurrentVisualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [
                makeProgram({
                    id: 'program2',
                    programType: 'WITHOUT_REGISTRATION',
                }),
            ],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'program2'
        )
    })

    it('should throw error for outputType ENROLLMENT when the program id is empty', () => {
        const visualization: CurrentVisualization = {
            outputType: 'ENROLLMENT',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [makeProgram({ id: '' })],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })

    it('should throw error for outputType EVENT when programDimensions is empty', () => {
        const visualization: CurrentVisualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('Expected exactly one program in programDimensions, found 0')
    })

    it('should throw error for outputType EVENT when programDimensions has multiple programs', () => {
        const visualization: CurrentVisualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [
                makeProgram({ id: 'prog1' }),
                makeProgram({ id: 'prog2' }),
            ],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('Expected exactly one program in programDimensions, found 2')
    })

    it('should return first programDimensions.id alphabetically for outputType TRACKED_ENTITY_INSTANCE with multiple programDimensions', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [
                makeProgram({ id: 'prog2', name: 'Program B' }),
                makeProgram({ id: 'prog1', name: 'Program A' }),
            ],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'prog1'
        )
    })

    it('should return the single programDimensions.id for outputType TRACKED_ENTITY_INSTANCE with a single programDimension', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [
                makeProgram({ id: 'prog-only', name: 'Program Only' }),
            ],
            trackedEntityType: undefined,
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe(
            'prog-only'
        )
    })

    it('should return trackedEntityType.id for outputType TRACKED_ENTITY_INSTANCE when programDimensions is empty', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [],
            trackedEntityType: { id: 'tet1', name: 'TET 1' },
        }
        expect(extractDataSourceIdFromVisualization(visualization)).toBe('tet1')
    })

    it('should throw error for outputType TRACKED_ENTITY_INSTANCE when programDimensions is empty and trackedEntityType.id is missing', () => {
        const visualization: CurrentVisualization = {
            outputType: 'TRACKED_ENTITY_INSTANCE',
            type: 'LINE_LIST',
            columns: [],
            rows: [],
            filters: [],
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
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [makeProgram({ id: '', name: 'Program A' })],
            trackedEntityType: undefined,
        }
        expect(() =>
            extractDataSourceIdFromVisualization(visualization)
        ).toThrow('No data source could be extracted from visualization object')
    })
})
