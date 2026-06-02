import type { DimensionArray, Program, ProgramStage } from '@types'
import { describe, it, expect } from 'vitest'
import {
    getCreatedDimension,
    getFixedMetaDimensions,
    META_DIMENSION_IDS,
    getMainDimensions,
    transformDimensions,
    isTimeDimensionId,
    getTimeDimensions,
    getTimeDimensionName,
    toAppLocalDimensions,
    toEventVisualizationDimensionId,
    getCompoundDimensionId,
    getTrackedEntityTypeFixedDimensions,
} from '../dimension'

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

    it.each([...META_DIMENSION_IDS])(
        'strips program and programStage from contextless dimension by ID: %s',
        (dimensionId) => {
            const dims: DimensionArray = [
                {
                    dimension: dimensionId,
                    items: [],
                    program: { id: 'prog1' },
                    programStage: { id: 'stage1' },
                },
            ]
            const result = toAppLocalDimensions(dims)
            expect(result[0].dimension).toBe(dimensionId)
            expect(result[0].program).toBeUndefined()
            expect(result[0].programStage).toBeUndefined()
        }
    )
})

describe('getFixedMetaDimensions', () => {
    it('returns all five fixed metadata dimensions', () => {
        const result = getFixedMetaDimensions()
        expect(result).toHaveLength(5)
        expect(result.map((d) => d.id)).toEqual([
            'lastUpdated',
            'lastUpdatedBy',
            'created',
            'createdBy',
            'completed',
        ])
    })

    it('returns correctly shaped items', () => {
        const result = getFixedMetaDimensions()
        for (const dim of result) {
            expect(dim.id).toBe(dim.dimensionId)
            expect(typeof dim.name).toBe('string')
            expect(dim.dimensionType).toMatch(/^(PERIOD|USER)$/)
        }
    })

    it('assigns PERIOD dimensionType to date-based dimensions', () => {
        const result = getFixedMetaDimensions()
        const dateDims = result.filter((d) => d.valueType === 'DATE')
        expect(dateDims.map((d) => d.id)).toEqual([
            'lastUpdated',
            'created',
            'completed',
        ])
        dateDims.forEach((d) => expect(d.dimensionType).toBe('PERIOD'))
    })

    it('assigns USER dimensionType to user-based dimensions', () => {
        const result = getFixedMetaDimensions()
        const userDims = result.filter((d) => d.dimensionType === 'USER')
        expect(userDims.map((d) => d.id)).toEqual([
            'lastUpdatedBy',
            'createdBy',
        ])
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

    it('falls back to plain ID for PROGRAM_ATTRIBUTE when no trackedEntityTypeId is provided', () => {
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

    it('prefixes PROGRAM_ATTRIBUTE with trackedEntityTypeId when provided', () => {
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'firstName',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                },
                'TRACKED_ENTITY_INSTANCE',
                'tetA'
            )
        ).toBe('tetA.firstName')
    })

    it('TET prefix wins over a program qualifier for PROGRAM_ATTRIBUTE', () => {
        /* Disambiguating per-TET takes precedence over per-program — the same
         * attribute UID can be referenced by multiple TETs but only ever has
         * one TET context at a time. */
        expect(
            getCompoundDimensionId(
                {
                    dimension: 'firstName',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    program: { id: 'prog1' },
                },
                'TRACKED_ENTITY_INSTANCE',
                'tetA'
            )
        ).toBe('tetA.firstName')
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

    it('uses trackedEntityTypeId prefix for the TEI registration org unit', () => {
        expect(
            getCompoundDimensionId(
                { dimension: 'enrollmentOu', items: [] },
                'TRACKED_ENTITY_INSTANCE',
                'tet1'
            )
        ).toBe('tet1.enrollmentOu')
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
    it('returns the registration org unit dimension', () => {
        const fixedDimensions = getTrackedEntityTypeFixedDimensions({
            id: 'tet1',
        })

        expect(fixedDimensions).toEqual([
            expect.objectContaining({
                id: 'tet1.enrollmentOu',
                dimensionId: 'enrollmentOu',
                dimensionType: 'ORGANISATION_UNIT',
                trackedEntityTypeId: 'tet1',
            }),
        ])
    })

    it('uses the tracked entity type id in the compound ID', () => {
        const fixedDimensions = getTrackedEntityTypeFixedDimensions({
            id: 'custom-tet',
        })

        expect(fixedDimensions[0].id).toBe('custom-tet.enrollmentOu')
    })
})
