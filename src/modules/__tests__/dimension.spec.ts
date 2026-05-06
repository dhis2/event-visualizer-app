import type {
    DimensionArray,
    DimensionMetadataItem,
    Program,
    ProgramStage,
} from '@types'
import { describe, it, expect } from 'vitest'
import {
    getFullDimensionId,
    getDimensionIdParts,
    getDimensionsWithSuffix,
    getCreatedDimension,
    getMainDimensions,
    getProgramDimensions,
    transformDimensions,
    isTimeDimensionId,
    getTimeDimensions,
    getTimeDimensionName,
    toAppLocalDimensions,
    toEventVisualizationDimensionId,
    getCompoundDimensionId,
    getTrackedEntityTypeFixedDimensions,
} from '../dimension'

const outputType = 'EVENT'

describe('getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const dimensionId = 'did'

        expect(getFullDimensionId({ dimensionId, outputType })).toEqual('did')
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'

        expect(
            getFullDimensionId({ dimensionId, programStageId, outputType })
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
                outputType,
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
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toEqual('pid.sid.did')
    })
})

describe('getDimensionIdParts', () => {
    it('returns correct result for: dimensionId', () => {
        const id = 'did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const id = 'sid.did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Event: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const outputType = 'EVENT'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Enrollment: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const outputType = 'ENROLLMENT'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + dimensionId', () => {
        const id = 'pid.did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: dimensionId', () => {
        const id = 'did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

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
                outputType,
            }),
            outputType,
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
                outputType,
            }),
            outputType,
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
                outputType,
            }),
            outputType,
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
                outputType: 'TRACKED_ENTITY_INSTANCE',
            }),
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toEqual(inputProgramId)
    })
})

describe('getDimensionIdParts + getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const inputId = 'did'

        const { dimensionId } = getDimensionIdParts({ id: inputId, outputType })

        const outputId = getFullDimensionId({
            dimensionId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId } = getDimensionIdParts({
            id: inputId,
            outputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            outputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputId = 'pid.sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            outputType: 'TRACKED_ENTITY_INSTANCE',
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
                dimensionId: 'created',
                dimensionType: 'PERIOD',
                name: expect.any(String), // Assuming i18n.t returns a string
                valueType: 'DATE',
            },
        })
    })
})

describe('getMainDimensions', () => {
    it('returns main dimensions for EVENT outputType', () => {
        const result = getMainDimensions('EVENT')
        expect(result).toHaveProperty('lastUpdated')
        expect(result.lastUpdated?.dimensionType).toBe('PERIOD')
        expect(result).toHaveProperty('createdBy')
        expect(result).toHaveProperty('lastUpdatedBy')
    })

    it('returns main dimensions for TRACKED_ENTITY_INSTANCE outputType', () => {
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
        const result = transformDimensions(dimensions)
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

    it('strips dy, latitude, and longitude dimensions', () => {
        const dimensions = [
            { dimension: 'ou', dimensionType: 'ORGANISATION_UNIT', items: [] },
            { dimension: 'dy', dimensionType: 'DATA_X', items: [] },
            { dimension: 'latitude', dimensionType: 'COORDINATE', items: [] },
            { dimension: 'longitude', dimensionType: 'COORDINATE', items: [] },
        ] as unknown as DimensionArray
        const result = transformDimensions(dimensions)
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

    it('leaves other dimensions unchanged', () => {
        const dimensions = [
            { dimension: 'ou', dimensionType: 'ORGANISATION_UNIT', items: [] },
            { dimension: 'eventDate', dimensionType: 'PERIOD', items: [] },
        ] as unknown as DimensionArray
        const result = transformDimensions(dimensions)
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "dimension": "ou",
              "dimensionType": "ORGANISATION_UNIT",
              "items": [],
            },
            {
              "dimension": "eventDate",
              "dimensionType": "PERIOD",
              "items": [],
            },
          ]
        `)
    })
})

describe('getDimensionsWithSuffix', () => {
    const mockMetadata: Record<
        string,
        DimensionMetadataItem | { name: string }
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

    it('returns dimensions without suffix for EVENT outputType', () => {
        const dimensionIds = ['did', 'sid.did']
        const result = getDimensionsWithSuffix({
            dimensionIds,
            metadata: mockMetadata,
            outputType: 'EVENT',
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
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })
        expect(result.some((d) => d.suffix)).toBeTruthy()
    })

    it('adds suffix for ORGANISATION_UNIT in TRACKED_ENTITY_INSTANCE', () => {
        const dimensionIds = ['pid.ou']
        const result = getDimensionsWithSuffix({
            dimensionIds,
            metadata: mockMetadata,
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })
        expect(result[0].suffix).toBe('Program Name')
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

describe('getTimeDimensions', () => {
    it('returns time dimensions object', () => {
        const result = getTimeDimensions()
        expect(result).toMatchInlineSnapshot(`
          {
            "completedDate": {
              "defaultName": "Completed date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "completedDate",
              "nameParentProperty": "stage",
              "nameProperty": "displayCompletedDateLabel",
            },
            "createdDate": {
              "defaultName": "Created date",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "createdDate",
              "nameParentProperty": "stage",
              "nameProperty": "displayCreatedDateLabel",
            },
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
            "lastUpdatedOn": {
              "defaultName": "Last updated on",
              "dimensionType": "PERIOD",
              "formatType": "DATE",
              "id": "lastUpdatedOn",
              "nameParentProperty": "stage",
              "nameProperty": "displayLastUpdatedOnLabel",
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
    } as unknown as Program
    const mockStage = {
        displayExecutionDateLabel: 'Custom Event Date',
        displayDueDateLabel: 'Custom Due Date',
    } as unknown as ProgramStage

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
        } as unknown as Program
        expect(getTimeDimensionName(dimension, programWithoutLabel)).toBe(
            'Incident date'
        )
    })
})

describe('toAppLocalDimensions', () => {
    it('renames ou to enrollmentOu when dimension has program but no programStage', () => {
        const dims: DimensionArray = [
            {
                dimension: 'ou',
                items: [],
                program: { id: 'prog1' },
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].dimension).toBe('enrollmentOu')
        expect(result[0].program).toEqual({ id: 'prog1' })
    })

    it('keeps ou unchanged when dimension has programStage (stage-scoped)', () => {
        const dims: DimensionArray = [
            {
                dimension: 'ou',
                items: [],
                program: { id: 'prog1' },
                programStage: { id: 'stage1' },
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].dimension).toBe('ou')
    })

    it('renames ou to enrollmentOu when dimension has no program/stage (TEI registration ou)', () => {
        const dims: DimensionArray = [
            {
                dimension: 'ou',
                items: [],
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].dimension).toBe('enrollmentOu')
    })

    it('does not modify non-ou dimensions', () => {
        const dims: DimensionArray = [
            {
                dimension: 'enrollmentDate',
                items: [],
                program: { id: 'prog1' },
            },
            {
                dimension: 'eventDate',
                items: [],
                programStage: { id: 'stage1' },
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].dimension).toBe('enrollmentDate')
        expect(result[1].dimension).toBe('eventDate')
    })

    it('strips program and programStage from ORGANISATION_UNIT_GROUP_SET dimensions (legacy backend noise)', () => {
        const dims: DimensionArray = [
            {
                dimension: 'area',
                dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                items: [],
                program: { id: 'prog1' },
                programStage: { id: 'stage1' },
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].dimension).toBe('area')
        expect(result[0].program).toBeUndefined()
        expect(result[0].programStage).toBeUndefined()
    })

    it('preserves other fields on a stripped contextless dimension', () => {
        const dims: DimensionArray = [
            {
                dimension: 'area',
                dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                items: [{ id: 'urban' }, { id: 'rural' }],
                program: { id: 'prog1' },
                programStage: { id: 'stage1' },
            },
        ]
        const result = toAppLocalDimensions(dims)
        expect(result[0].items).toEqual([{ id: 'urban' }, { id: 'rural' }])
        expect(result[0].dimensionType).toBe('ORGANISATION_UNIT_GROUP_SET')
    })
})

describe('toEventVisualizationDimensionId', () => {
    describe('enrollmentOu', () => {
        it('keeps enrollmentOu for program-scope + EVENT + LINE_LIST', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: 'prog1',
                    outputType: 'EVENT',
                    visualizationType: 'LINE_LIST',
                })
            ).toBe('enrollmentOu')
        })

        it('rewrites to ou for program-scope + ENROLLMENT + LINE_LIST', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: 'prog1',
                    outputType: 'ENROLLMENT',
                    visualizationType: 'LINE_LIST',
                })
            ).toBe('ou')
        })

        it('keeps enrollmentOu for program-scope + TRACKED_ENTITY_INSTANCE + LINE_LIST', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: 'prog1',
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    visualizationType: 'LINE_LIST',
                })
            ).toBe('enrollmentOu')
        })

        it('rewrites to ou for program-scope + EVENT + PIVOT_TABLE', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: 'prog1',
                    outputType: 'EVENT',
                    visualizationType: 'PIVOT_TABLE',
                })
            ).toBe('ou')
        })

        it('rewrites to ou for program-scope + ENROLLMENT + PIVOT_TABLE', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    programId: 'prog1',
                    outputType: 'ENROLLMENT',
                    visualizationType: 'PIVOT_TABLE',
                })
            ).toBe('ou')
        })

        it('rewrites to ou for TEI registration scope (no programId) + LINE_LIST', () => {
            expect(
                toEventVisualizationDimensionId({
                    dimensionId: 'enrollmentOu',
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    visualizationType: 'LINE_LIST',
                })
            ).toBe('ou')
        })
    })

    it('passes through other dimension IDs unchanged', () => {
        expect(
            toEventVisualizationDimensionId({
                dimensionId: 'eventDate',
                programId: 'prog1',
                outputType: 'ENROLLMENT',
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe('eventDate')
        expect(
            toEventVisualizationDimensionId({
                dimensionId: 'ou',
                programId: 'prog1',
                outputType: 'ENROLLMENT',
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe('ou')
        expect(
            toEventVisualizationDimensionId({
                dimensionId: 'enrollmentDate',
                programId: 'prog1',
                outputType: 'ENROLLMENT',
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe('enrollmentDate')
    })
})

describe('getCompoundDimensionId', () => {
    it('returns plain ID for PROGRAM_INDICATOR regardless of context', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'bcgDoses',
                    dimensionType: 'PROGRAM_INDICATOR',
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
                'EVENT'
            )
        ).toBe('bcgDoses')
    })

    it('returns plain ID for PROGRAM_ATTRIBUTE regardless of context', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'firstName',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    program: { id: 'prog1' },
                },
                'ENROLLMENT'
            )
        ).toBe('firstName')
    })

    it('prefixes enrollment-scoped dimensions with programId', () => {
        const enrollmentDims = [
            'enrollmentOu',
            'enrollmentDate',
            'incidentDate',
            'programStatus',
        ]
        for (const dimId of enrollmentDims) {
            expect(
                getCompoundDimensionId(
                    {
                        dimension: dimId,
                        items: [],
                        program: { id: 'prog1' },
                    },
                    'ENROLLMENT'
                )
            ).toBe(`prog1.${dimId}`)
        }
    })

    it('prefixes enrollment-scoped dimensions with programId even when programStage is present', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'enrollmentDate',
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
                'ENROLLMENT'
            )
        ).toBe('prog1.enrollmentDate')
    })

    it('uses stageId.dimensionId for EVENT with programStage', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'weight',
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
                'EVENT'
            )
        ).toBe('stage1.weight')
    })

    it('uses stageId.dimensionId for ENROLLMENT with programStage', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'weight',
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
                'ENROLLMENT'
            )
        ).toBe('stage1.weight')
    })

    it('uses programId.stageId.dimensionId for TRACKED_ENTITY_INSTANCE with programStage', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'weight',
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
                'TRACKED_ENTITY_INSTANCE'
            )
        ).toBe('prog1.stage1.weight')
    })

    it('uses programId.dimensionId when only program is present (no stage)', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'someField',
                    items: [],
                    program: { id: 'prog1' },
                },
                'EVENT'
            )
        ).toBe('prog1.someField')
    })

    it('uses trackedEntityTypeId prefix for TEI registration dimensions', () => {
        expect(
            getCompoundDimensionId(
                { dimension: 'enrollmentOu', items: [] },
                'TRACKED_ENTITY_INSTANCE',
                'tet1'
            )
        ).toBe('tet1.enrollmentOu')

        expect(
            getCompoundDimensionId(
                { dimension: 'created', items: [] },
                'TRACKED_ENTITY_INSTANCE',
                'tet1'
            )
        ).toBe('tet1.created')
    })

    it('does not prefix non-registration dimensions with trackedEntityTypeId', () => {
        expect(
            getCompoundDimensionId(
                { dimension: 'lastUpdated', items: [] },
                'TRACKED_ENTITY_INSTANCE',
                'tet1'
            )
        ).toBe('lastUpdated')
    })

    it('returns plain ID when no context is present', () => {
        expect(
            getCompoundDimensionId({ dimension: 'someField', items: [] })
        ).toBe('someField')
    })

    it('returns plain ID for ORGANISATION_UNIT_GROUP_SET after toAppLocalDimensions stripping', () => {
        // Contextless dimensions have program/programStage stripped at the
        // boundary; the helper then naturally falls through to plain ID.
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'area',
                    dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                    items: [],
                },
                'EVENT'
            )
        ).toBe('area')
    })
})

describe('getTrackedEntityTypeFixedDimensions', () => {
    it('returns registration org unit and registration date dimensions', () => {
        const fixedDimensions = getTrackedEntityTypeFixedDimensions({
            id: 'tet1',
        })

        expect(fixedDimensions).toHaveLength(2)
        expect(fixedDimensions).toEqual([
            expect.objectContaining({
                id: 'tet1.enrollmentOu',
                dimensionId: 'enrollmentOu',
                dimensionType: 'ORGANISATION_UNIT',
                trackedEntityTypeId: 'tet1',
            }),
            expect.objectContaining({
                id: 'tet1.created',
                dimensionId: 'created',
                dimensionType: 'PERIOD',
                trackedEntityTypeId: 'tet1',
            }),
        ])
    })

    it('uses the tracked entity type id in compound IDs', () => {
        const fixedDimensions = getTrackedEntityTypeFixedDimensions({
            id: 'custom-tet',
        })

        expect(fixedDimensions[0].id).toBe('custom-tet.enrollmentOu')
        expect(fixedDimensions[1].id).toBe('custom-tet.created')
    })
})
