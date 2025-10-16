import { describe, it, expect } from 'vitest'
import {
    getFullDimensionId,
    getDimensionIdParts,
    getDimensionsWithSuffix,
    getCreatedDimension,
    getMainDimensions,
    getProgramDimensions,
    transformDimensions,
    isProgramDimensionType,
    isYourDimensionType,
    isTimeDimensionId,
    formatDimensionId,
    getTimeDimensions,
    getTimeDimensionName,
} from '../dimension'
import type {
    DimensionArray,
    CurrentVisualization,
    InternalDimensionRecord,
    SavedVisualization,
} from '@types'

const inputType = 'EVENT'
describe('getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const dimensionId = 'did'

        expect(getFullDimensionId({ dimensionId, inputType })).toEqual('did')
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'

        expect(
            getFullDimensionId({ dimensionId, programStageId, inputType })
        ).toEqual('sid.did')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'
        const programId = 'pid'

        expect(
            getFullDimensionId({
                dimensionId,
                programStageId,
                programId,
                inputType,
            })
        ).toEqual('sid.did')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'
        const programId = 'pid'

        expect(
            getFullDimensionId({
                dimensionId,
                programStageId,
                programId,
                inputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toEqual('pid.sid.did')
    })
})

describe('getDimensionIdParts', () => {
    it('returns correct result for: dimensionId', () => {
        const id = 'did'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const id = 'sid.did'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Event: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const inputType = 'EVENT'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Enrollment: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const inputType = 'ENROLLMENT'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + dimensionId', () => {
        const id = 'pid.did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: dimensionId', () => {
        const id = 'did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
})

describe('getFullDimensionId + getDimensionIdParts', () => {
    it('returns correct result for: dimensionId', () => {
        const inputDimensionId = 'did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                inputType,
            }),
            inputType,
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toBeFalsy()
        expect(programId).toBeUndefined()
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
                inputType,
            }),
            inputType,
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toBeUndefined()
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'
        const inputProgramId = 'pid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
                programId: inputProgramId,
                inputType,
            }),
            inputType,
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toBeUndefined()
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'
        const inputProgramId = 'pid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
                programId: inputProgramId,
                inputType: 'TRACKED_ENTITY_INSTANCE',
            }),
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toEqual(inputProgramId)
    })
})

describe('getDimensionIdParts + getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const inputId = 'did'

        const { dimensionId } = getDimensionIdParts({ id: inputId, inputType })

        const outputId = getFullDimensionId({
            dimensionId,
            inputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId } = getDimensionIdParts({
            id: inputId,
            inputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            inputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            inputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            inputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputId = 'pid.sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(outputId).toEqual(inputId)
    })
})

describe('getCreatedDimension', () => {
    it('returns the created dimension object', () => {
        const result = getCreatedDimension()
        expect(result).toEqual({
            created: {
                id: 'created',
                dimensionType: 'PERIOD',
                name: expect.any(String), // Assuming i18n.t returns a string
            },
        })
    })
})

describe('getMainDimensions', () => {
    it('returns main dimensions for EVENT inputType', () => {
        const result = getMainDimensions('EVENT')
        expect(result).toHaveProperty('lastUpdated')
        expect(result.lastUpdated?.dimensionType).toBe('PERIOD')
        expect(result).toHaveProperty('createdBy')
        expect(result).toHaveProperty('lastUpdatedBy')
    })

    it('returns main dimensions for TRACKED_ENTITY_INSTANCE inputType', () => {
        const result = getMainDimensions('TRACKED_ENTITY_INSTANCE')
        expect(result).toHaveProperty('ou')
        expect(result).toHaveProperty('created')
        expect(result.created?.dimensionType).toBe('PERIOD')
        expect(result).toHaveProperty('lastUpdated')
    })
})

describe('getProgramDimensions', () => {
    it('returns program dimensions for a given programId', () => {
        const programId = 'pid'
        const result = getProgramDimensions(programId)
        expect(result).toHaveProperty(`${programId}.ou`)
        expect(result).toHaveProperty(`${programId}.eventStatus`)
        expect(result).toHaveProperty(`${programId}.programStatus`)
        expect(result[`${programId}.ou`].dimensionType).toBe(
            'ORGANISATION_UNIT'
        )
    })
})

describe('transformDimensions', () => {
    it('transforms PROGRAM_DATA_ELEMENT to DATA_ELEMENT', () => {
        const dimensions = [
            {
                dimension: 'de1',
                dimensionType: 'PROGRAM_DATA_ELEMENT',
                items: [],
            },
        ] as unknown as DimensionArray
        const visualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
        } as CurrentVisualization
        const result = transformDimensions(dimensions, visualization)
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "dimension": "de1",
              "dimensionType": "DATA_ELEMENT",
              "items": [],
            },
          ]
        `)
    })

    it('transforms pe dimension to appropriate time dimension for LINE_LIST', () => {
        const dimensions = [
            { dimension: 'pe', dimensionType: 'PERIOD', items: [] },
        ] as unknown as DimensionArray
        const visualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
        } as CurrentVisualization
        const result = transformDimensions(dimensions, visualization)
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "dimension": "eventDate",
              "dimensionType": "PERIOD",
              "items": [],
            },
          ]
        `)
    })

    it('leaves other dimensions unchanged', () => {
        const dimensions = [
            { dimension: 'ou', dimensionType: 'ORGANISATION_UNIT', items: [] },
            { dimension: 'longitude', dimensionType: 'COORDINATE', items: [] },
        ] as unknown as DimensionArray
        const visualization = {
            outputType: 'EVENT',
            type: 'LINE_LIST',
        } as CurrentVisualization
        const result = transformDimensions(dimensions, visualization)
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "dimension": "ou",
              "dimensionType": "ORGANISATION_UNIT",
              "items": [],
            },
          ]
        `)
    })
})

describe('getDimensionsWithSuffix', () => {
    const mockMetadata: Record<
        string,
        InternalDimensionRecord | { name: string }
    > = {
        did: { id: 'did', dimensionType: 'DATA_ELEMENT', name: 'Data Element' },
        'sid.did': {
            id: 'sid.did',
            dimensionType: 'DATA_ELEMENT',
            name: 'Data Element',
        },
        'pid.sid.did': {
            id: 'pid.sid.did',
            dimensionType: 'DATA_ELEMENT',
            name: 'Data Element',
        },
        'pid.sid.did2': {
            id: 'pid.sid.did2',
            dimensionType: 'DATA_ELEMENT',
            name: 'Data Element 2',
        },
        sid: { name: 'Stage Name' },
        pid: { name: 'Program Name' },
        'pid.ou': {
            id: 'pid.ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: 'Organisation Unit',
        },
    }

    it('returns dimensions without suffix for EVENT inputType', () => {
        const dimensionIds = ['did', 'sid.did']
        const result = getDimensionsWithSuffix({
            dimensionIds,
            metadata: mockMetadata,
            inputType: 'EVENT',
        })
        expect(result[0].suffix).toBeUndefined()
        expect(result[1].suffix).toBeUndefined()
    })

    it('adds suffix for TRACKED_ENTITY_INSTANCE with duplicates', () => {
        const dimensionIds = ['pid.sid.did', 'pid.sid2.did']
        const result = getDimensionsWithSuffix({
            dimensionIds,
            metadata: {
                ...mockMetadata,
                'pid.sid2.did': {
                    id: 'pid.sid2.did',
                    dimensionType: 'DATA_ELEMENT',
                },
                sid2: { name: 'Stage2 Name' },
            },
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })
        expect(result.some((d) => d.suffix)).toBeTruthy()
    })

    it('adds suffix for ORGANISATION_UNIT in TRACKED_ENTITY_INSTANCE', () => {
        const dimensionIds = ['pid.ou']
        const result = getDimensionsWithSuffix({
            dimensionIds,
            metadata: mockMetadata,
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })
        expect(result[0].suffix).toBe('Program Name')
    })
})

describe('isProgramDimensionType', () => {
    it('returns true for program dimension types', () => {
        expect(isProgramDimensionType('DATA_ELEMENT')).toBe(true)
        expect(isProgramDimensionType('PROGRAM_ATTRIBUTE')).toBe(true)
        expect(isProgramDimensionType('PROGRAM_INDICATOR')).toBe(true)
        expect(isProgramDimensionType('CATEGORY')).toBe(true)
        expect(isProgramDimensionType('CATEGORY_OPTION_GROUP_SET')).toBe(true)
    })

    it('returns false for non-program dimension types', () => {
        expect(isProgramDimensionType('PERIOD')).toBe(false)
        expect(isProgramDimensionType('ORGANISATION_UNIT')).toBe(false)
        expect(isProgramDimensionType('USER')).toBe(false)
        expect(isProgramDimensionType('STATUS')).toBe(false)
    })
})

describe('isYourDimensionType', () => {
    it('returns true for your dimension types', () => {
        expect(isYourDimensionType('ORGANISATION_UNIT_GROUP_SET')).toBe(true)
    })

    it('returns false for non-your dimension types', () => {
        expect(isYourDimensionType('DATA_ELEMENT')).toBe(false)
        expect(isYourDimensionType('PERIOD')).toBe(false)
        expect(isYourDimensionType('ORGANISATION_UNIT')).toBe(false)
    })
})

describe('isTimeDimensionId', () => {
    it('returns true for time dimension ids', () => {
        expect(isTimeDimensionId('eventDate')).toBe(true)
        expect(isTimeDimensionId('enrollmentDate')).toBe(true)
        expect(isTimeDimensionId('incidentDate')).toBe(true)
        expect(isTimeDimensionId('lastUpdated')).toBe(true)
        expect(isTimeDimensionId('scheduledDate')).toBe(true)
    })

    it('returns false for non-time dimension ids', () => {
        expect(isTimeDimensionId('ou')).toBe(false)
        expect(isTimeDimensionId('created')).toBe(false)
        expect(isTimeDimensionId('eventStatus')).toBe(false)
    })
})

describe('formatDimensionId', () => {
    it('returns correct result for TRACKED_ENTITY_INSTANCE outputType', () => {
        expect(
            formatDimensionId({
                dimensionId: 'ou',
                programId: 'pid',
                programStageId: 'sid',
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe('pid.sid.ou')
    })

    it('returns correct result for EVENT outputType', () => {
        expect(
            formatDimensionId({
                dimensionId: 'ou',
                programId: 'pid',
                programStageId: 'sid',
                outputType: 'EVENT',
            })
        ).toBe('sid.ou')
    })

    it('returns correct result without programId', () => {
        expect(
            formatDimensionId({
                dimensionId: 'ou',
                programStageId: 'sid',
                outputType: 'EVENT',
            })
        ).toBe('sid.ou')
    })

    it('returns correct result with only dimensionId', () => {
        expect(
            formatDimensionId({
                dimensionId: 'ou',
                outputType: 'EVENT',
            })
        ).toBe('ou')
    })
})

describe('getTimeDimensions', () => {
    it('returns time dimensions object', () => {
        const result = getTimeDimensions()
        expect(result).toMatchInlineSnapshot(`
          {
            "enrollmentDate": {
              "defaultName": "Enrollment date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "enrollmentDate",
              "nameParentProperty": "program",
              "nameProperty": "displayEnrollmentDateLabel",
            },
            "eventDate": {
              "defaultName": "Event date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "eventDate",
              "nameParentProperty": "stage",
              "nameProperty": "displayExecutionDateLabel",
            },
            "incidentDate": {
              "defaultName": "Incident date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "incidentDate",
              "nameParentProperty": "program",
              "nameProperty": "displayIncidentDateLabel",
            },
            "scheduledDate": {
              "defaultName": "Scheduled date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "scheduledDate",
              "nameParentProperty": "stage",
              "nameProperty": "displayDueDateLabel",
            },
          }
        `)
    })
})

describe('getTimeDimensionName', () => {
    const mockProgram = {
        displayEnrollmentDateLabel: 'Custom Enrollment Date',
        displayIncidentDateLabel: 'Custom Incident Date',
        programType: 'WITH_REGISTRATION',
    } as unknown as SavedVisualization['program']
    const mockStage = {
        displayExecutionDateLabel: 'Custom Event Date',
        displayDueDateLabel: 'Custom Due Date',
    } as unknown as SavedVisualization['programStage']

    it('returns default name when no program provided', () => {
        const dimension = getTimeDimensions().eventDate
        expect(getTimeDimensionName(dimension)).toBe('Event date')
    })

    it('returns default name when no nameParentProperty', () => {
        const dimension = {
            ...getTimeDimensions().eventDate,
            nameParentProperty: undefined as unknown as 'program' | 'stage',
        }
        expect(getTimeDimensionName(dimension, mockProgram)).toBe('Event date')
    })

    it('returns program name for program parent property', () => {
        const dimension = getTimeDimensions().enrollmentDate
        expect(getTimeDimensionName(dimension, mockProgram)).toBe(
            'Custom Enrollment Date'
        )
    })

    it('returns stage name for stage parent property', () => {
        const dimension = getTimeDimensions().eventDate
        expect(getTimeDimensionName(dimension, mockProgram, mockStage)).toBe(
            'Custom Event Date'
        )
    })

    it('returns default name when custom name is not available', () => {
        const dimension = getTimeDimensions().incidentDate
        const programWithoutLabel = {
            programType: 'WITH_REGISTRATION',
        } as unknown as SavedVisualization['program']
        expect(getTimeDimensionName(dimension, programWithoutLabel)).toBe(
            'Incident date'
        )
    })
})
