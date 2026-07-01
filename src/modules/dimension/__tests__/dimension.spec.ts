import {
    getDimensionBlockReason,
    getDimensionLayoutBlockedMessage,
    isDimensionCrossTet,
    isDimensionFullyInvalidForVisType,
    isDimensionTypeFullyInvalidForVisType,
} from '@modules/dimension/blocking'
import { getDefaultItemsForDimension } from '@modules/dimension/default-items'
import {
    getCreatedDimension,
    getFixedMetaDimensions,
    getMainDimensions,
    getTrackedEntityTypeFixedDimensions,
} from '@modules/dimension/fixed'
import {
    META_DIMENSION_IDS,
    getCompoundDimensionId,
    isCompoundDimensionId,
    parseCompoundDimensionId,
    resolveId,
} from '@modules/dimension/ids'
import {
    isTimeDimensionId,
    getTimeDimensions,
    getTimeDimensionName,
} from '@modules/dimension/time'
import {
    transformDimensions,
    toAppLocalDimensions,
    toEventVisualizationDimensionId,
} from '@modules/dimension/translation'
import type {
    DimensionArray,
    DimensionMetadataItem,
    Program,
    ProgramStage,
} from '@types'
import { describe, it, expect } from 'vitest'

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

describe('getDefaultItemsForDimension', () => {
    it('defaults org unit dimensions to the current user org unit', () => {
        expect(getDefaultItemsForDimension('stage1.ou')).toEqual([
            'USER_ORGUNIT',
        ])
        expect(getDefaultItemsForDimension('program1.enrollmentOu')).toEqual([
            'USER_ORGUNIT',
        ])
    })

    it('defaults time dimensions to the provided relative period', () => {
        expect(
            getDefaultItemsForDimension('stage1.eventDate', 'LAST_12_MONTHS')
        ).toEqual(['LAST_12_MONTHS'])
        expect(
            getDefaultItemsForDimension('program1.enrollmentDate', 'THIS_YEAR')
        ).toEqual(['THIS_YEAR'])
    })

    it('returns no default for a time dimension when no relative period is given', () => {
        expect(getDefaultItemsForDimension('stage1.eventDate')).toBeUndefined()
    })

    it('returns no default for non-org-unit, non-time dimensions', () => {
        expect(
            getDefaultItemsForDimension('stage1.dataElement1', 'LAST_12_MONTHS')
        ).toBeUndefined()
    })
})

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: overrides.id ?? 'fallback.id',
    dimensionId: overrides.dimensionId ?? 'fallback',
    name: overrides.name ?? 'Fallback',
    dimensionType: overrides.dimensionType ?? 'DATA_ELEMENT',
    ...overrides,
})

type BlockedArgs = Parameters<typeof getDimensionLayoutBlockedMessage>[0]

const getMessage = (
    args: Partial<BlockedArgs> & Pick<BlockedArgs, 'dimension'>
): string | null =>
    getDimensionLayoutBlockedMessage({
        visualizationType: 'PIVOT_TABLE',
        customValueId: null,
        layoutTetId: null,
        dimensionTetId: null,
        crossTetMessage: '',
        ...args,
    })

type ReasonArgs = Parameters<typeof getDimensionBlockReason>[0]

const getReason = (args: Partial<ReasonArgs> & Pick<ReasonArgs, 'dimension'>) =>
    getDimensionBlockReason({
        visualizationType: 'PIVOT_TABLE',
        customValueId: null,
        layoutTetId: null,
        dimensionTetId: null,
        ...args,
    })

describe('getDimensionBlockReason', () => {
    it('returns customValue when the dim is the custom value', () => {
        expect(
            getReason({ dimension: makeDim({ id: 'x' }), customValueId: 'x' })
        ).toBe('customValue')
    })

    it('returns visType for a program indicator outside line list', () => {
        expect(
            getReason({
                dimension: makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
            })
        ).toBe('visType')
    })

    it('returns crossTet when the dim TET differs from the layout TET', () => {
        expect(
            getReason({
                dimension: makeDim({}),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('crossTet')
    })

    it('returns null when nothing applies', () => {
        expect(
            getReason({
                dimension: makeDim({}),
                visualizationType: 'LINE_LIST',
            })
        ).toBeNull()
    })

    it('prefers customValue, then visType, over crossTet', () => {
        expect(
            getReason({
                dimension: makeDim({
                    id: 'pi',
                    dimensionType: 'PROGRAM_INDICATOR',
                }),
                customValueId: 'pi',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('customValue')
        expect(
            getReason({
                dimension: makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('visType')
    })
})

describe('getDimensionLayoutBlockedMessage — custom-value rule (Case C)', () => {
    it('disables the dim whose compound id matches the custom value id', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de1' }),
                customValueId: 'stage1.de1',
            })
        ).toBe('Already used as custom value.')
    })

    it('does not disable a different stage-instance of the same DE', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stageB.de1' }),
                customValueId: 'stageA.de1',
            })
        ).toBeNull()
    })

    it('leaves non-matching dims enabled', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de2' }),
                customValueId: 'stage1.de1',
            })
        ).toBeNull()
    })

    it('does not fire when no custom value is set', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de1' }),
                customValueId: null,
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — registration OU rule (Case B)', () => {
    const registrationOuDim = makeDim({
        id: 'tetA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetA',
    })

    it('blocks the TET registration OU item when vis is PIVOT_TABLE', () => {
        expect(
            getMessage({
                dimension: registrationOuDim,
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe('Cannot be used in a Pivot table.')
    })

    it('does not disable the TET registration OU item when vis is LINE_LIST', () => {
        expect(
            getMessage({
                dimension: registrationOuDim,
                visualizationType: 'LINE_LIST',
            })
        ).toBeNull()
    })

    it('does not fire for program-scope enrollment OU (no trackedEntityTypeId)', () => {
        const programEnrollmentOu = makeDim({
            id: 'progA.enrollmentOu',
            dimensionId: 'enrollmentOu',
            dimensionType: 'ORGANISATION_UNIT',
            programId: 'progA',
        })
        expect(
            getMessage({
                dimension: programEnrollmentOu,
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBeNull()
    })

    it('does not fire for stage event OU (dimensionId is "ou", not "enrollmentOu")', () => {
        const stageOu = makeDim({
            id: 'stage1.ou',
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            programId: 'progA',
            programStageId: 'stage1',
        })
        expect(
            getMessage({
                dimension: stageOu,
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — cross-TET rule (Case D)', () => {
    const crossTetMessage =
        'Person dimensions cannot be combined with Malaria case dimensions already in the layout.'

    it('blocks a dim whose TET differs from the layout TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetB.attr' }),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBe(crossTetMessage)
    })

    it('does not block when the dim TET matches the layout TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetA.attr' }),
                dimensionTetId: 'tetA',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBeNull()
    })

    it('does not block a generic dim (no TET) even when the layout has a TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'pe' }),
                dimensionTetId: null,
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBeNull()
    })

    it('does not block when the layout has no TET yet', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetB.attr' }),
                dimensionTetId: 'tetB',
                layoutTetId: null,
                crossTetMessage,
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — rule precedence', () => {
    const crossTetMessage = 'cross-tet message'

    it('returns the custom-value message when it could fire alongside cross-TET', () => {
        expect(
            getMessage({
                dimension: makeDim({
                    id: 'tetA.enrollmentOu',
                    dimensionId: 'enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tetA',
                }),
                customValueId: 'tetA.enrollmentOu',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toContain('custom value')
    })

    it('returns the vis-type message when it could fire alongside cross-TET', () => {
        expect(
            getMessage({
                dimension: makeDim({
                    id: 'pi1',
                    dimensionType: 'PROGRAM_INDICATOR',
                }),
                visualizationType: 'PIVOT_TABLE',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBe('Cannot be used in a Pivot table.')
    })
})

describe('isDimensionCrossTet', () => {
    it('returns true when both TET ids are set and differ', () => {
        expect(isDimensionCrossTet('tetB', 'tetA')).toBe(true)
    })

    it('returns false when the TET ids match', () => {
        expect(isDimensionCrossTet('tetA', 'tetA')).toBe(false)
    })

    it('returns false when the dimension has no TET (generic dim)', () => {
        expect(isDimensionCrossTet(null, 'tetA')).toBe(false)
    })

    it('returns false when the layout has no TET yet', () => {
        expect(isDimensionCrossTet('tetB', null)).toBe(false)
    })

    it('returns false when both are null', () => {
        expect(isDimensionCrossTet(null, null)).toBe(false)
    })
})

describe('isDimensionTypeFullyInvalidForVisType', () => {
    it('marks PROGRAM_INDICATOR invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType(
                'PROGRAM_INDICATOR',
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks PROGRAM_INDICATOR valid for LINE_LIST', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType(
                'PROGRAM_INDICATOR',
                'LINE_LIST'
            )
        ).toBe(false)
    })

    it('marks DATA_ELEMENT valid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType('DATA_ELEMENT', 'PIVOT_TABLE')
        ).toBe(false)
    })

    it('marks CATEGORY valid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType('CATEGORY', 'PIVOT_TABLE')
        ).toBe(false)
    })
})

describe('isDimensionFullyInvalidForVisType', () => {
    const makeDim = (
        overrides: Partial<DimensionMetadataItem> = {}
    ): Partial<DimensionMetadataItem> => ({
        dimensionType: 'DATA_ELEMENT',
        dimensionId: 'someDimId',
        ...overrides,
    })

    it('returns false for any dimension when target is LINE_LIST', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                'LINE_LIST'
            )
        ).toBe(false)
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({
                    dimensionId: 'enrollmentOu',
                    trackedEntityTypeId: 'tetId',
                }),
                'LINE_LIST'
            )
        ).toBe(false)
    })

    it('marks PROGRAM_INDICATOR invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks TET registration OU invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({
                    dimensionId: 'enrollmentOu',
                    trackedEntityTypeId: 'tetId',
                }),
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks program-scope enrollmentOu (no TET) valid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionId: 'enrollmentOu' }),
                'PIVOT_TABLE'
            )
        ).toBe(false)
    })

    it('marks an ordinary numeric DATA_ELEMENT valid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'DATA_ELEMENT' }),
                'PIVOT_TABLE'
            )
        ).toBe(false)
    })
})

describe('parseCompoundDimensionId', () => {
    describe('valid inputs', () => {
        it('parses a single dimension ID', () => {
            const result = parseCompoundDimensionId('dimensionId')
            expect(result).toEqual({
                ids: ['dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId.dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program ID, stage ID, and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programId.stageId.dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID with repetition index and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 0,
            })
        })

        it('parses program/stage ID with different repetition index and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 1,
            })
        })

        it('parses program ID, stage ID with repetition index, and dimension ID', () => {
            const result = parseCompoundDimensionId(
                'programId.stageId[2].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: 2,
            })
        })

        it('parses multi-digit repetition index', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[123].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 123,
            })
        })
    })

    describe('invalid inputs', () => {
        it('throws error for empty string', () => {
            expect(() => parseCompoundDimensionId('')).toThrow(
                'Dimension ID input is not a populated string'
            )
        })

        it('throws error for only repetition index without dimension', () => {
            expect(() => parseCompoundDimensionId('[1]')).toThrow(
                'No valid dimension ID found in "[1]"'
            )
        })

        it('throws error for empty dimension after dot', () => {
            expect(() => parseCompoundDimensionId('programId.')).toThrow(
                'No valid dimension ID found in "programId."'
            )
        })

        it('throws error for empty dimension with repetition index', () => {
            expect(() => parseCompoundDimensionId('programId.[0]')).toThrow(
                'No valid dimension ID found in "programId.[0]"'
            )
        })

        it('throws error for double dots', () => {
            expect(() =>
                parseCompoundDimensionId('programId..dimensionId')
            ).toThrow(
                'Invalid dimension ID format: empty ID found in "programId..dimensionId"'
            )
        })

        it('throws error for leading dot', () => {
            expect(() => parseCompoundDimensionId('.dimensionId')).toThrow(
                'Invalid dimension ID format: empty ID found in ".dimensionId"'
            )
        })

        it('throws error for more than 3 IDs', () => {
            expect(() => parseCompoundDimensionId('a.b.c.d')).toThrow(
                'Invalid dimension ID format: expected at most 3 IDs, got 4'
            )
        })
    })

    describe('repetition index values', () => {
        it('handles repetition index of zero', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result.repetitionIndex).toBe(0)
        })

        it('handles negative repetition index', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[-1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: -1,
            })
        })

        it('extracts repetition index from anywhere in the string', () => {
            const result = parseCompoundDimensionId(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: 0,
            })
        })
    })
})

describe('isCompoundDimensionId', () => {
    it('returns true for a dotted string', () => {
        expect(isCompoundDimensionId('stage.dimension')).toBe(true)
    })

    it('returns true for a three-part compound key', () => {
        expect(isCompoundDimensionId('program.stage.dimension')).toBe(true)
    })

    it('returns false for a plain string without dots', () => {
        expect(isCompoundDimensionId('dimensionId')).toBe(false)
    })

    it('returns false for an empty string', () => {
        expect(isCompoundDimensionId('')).toBe(false)
    })

    it('returns false for null', () => {
        expect(isCompoundDimensionId(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(isCompoundDimensionId(undefined)).toBe(false)
    })

    it('returns false for a number', () => {
        expect(isCompoundDimensionId(42)).toBe(false)
    })
})

describe('resolveId', () => {
    it('returns a plain key unchanged', () => {
        expect(resolveId('dimensionId')).toBe('dimensionId')
    })

    it('returns a 2-segment key unchanged (already canonical)', () => {
        expect(resolveId('stageId.dimId')).toBe('stageId.dimId')
    })

    it('drops the first segment of a 3-segment key', () => {
        expect(resolveId('programId.stageId.dimId')).toBe('stageId.dimId')
    })

    it('handles a 3-segment key with a repetition index on the stage segment', () => {
        // [n] contains no dots, so the segment count is still 3
        expect(resolveId('programId.stageId[0].dimId')).toBe('stageId[0].dimId')
    })

    it('handles a 2-segment key with a repetition index', () => {
        expect(resolveId('stageId[1].dimId')).toBe('stageId[1].dimId')
    })
})
