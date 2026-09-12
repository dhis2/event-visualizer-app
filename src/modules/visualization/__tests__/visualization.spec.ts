import { DEFAULT_OPTIONS } from '@constants/options'
import { MetadataStore } from '@modules/metadata/store'
import { getDefaultOptions } from '@modules/options'
import {
    getSaveableVisualization,
    getVisualizationState,
    getVisualizationUiConfig,
    isDefaultOptionValue,
    normalizeApiSavedVisualization,
    toCurrentVis,
} from '@modules/visualization/state'
import { buildCurrentVisFromVisUiConfig } from '@store/thunks'
import type {
    ApiSavedVisualization,
    CurrentVisualization,
    EventVisualizationOptions,
    SavedVisualization,
} from '@types'
import { describe, it, expect } from 'vitest'

const PID = 'pid'
const SID = 'sid'
const UID = 'a3kGcGDCuk6'

const testCases = {
    lineListEnrollment: {
        input: {
            type: 'LINE_LIST',
            outputType: 'ENROLLMENT',
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PROGRAM_INDICATOR',
                    items: [],
                    dimension: 'bcgDoses',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'lastName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'DATA_X',
                    items: [
                        {
                            id: 'COMPLETED',
                        },
                        {
                            id: 'ACTIVE',
                        },
                    ],
                    dimension: 'programStatus',
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'birth',
                    },
                    program: {
                        id: 'IpHINAT79UW',
                    },
                    filter: 'IN:Exclusive;Mixed',
                    dimension: 'infantFeeding',
                    valueType: 'TEXT',
                    optionSet: {
                        id: 'x31y45jvIQL',
                    },
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'babyPostnatal',
                    },
                    program: {
                        id: 'IpHINAT79UW',
                    },
                    dimension: 'infantFeeding',
                    valueType: 'TEXT',
                    optionSet: {
                        id: 'x31y45jvIQL',
                    },
                    repetition: {
                        indexes: [-2, -1, 0],
                    },
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                enrollmentOu: ['USER_ORGUNIT'],
                bcgDoses: [],
                lastName: [],
                enrollmentDate: [],
                programStatus: ['COMPLETED', 'ACTIVE'],
                'birth.infantFeeding': [],
                'babyPostnatal.infantFeeding': [],
            },
            conditionsByDimension: {
                'birth.infantFeeding': {
                    condition: 'IN:Exclusive;Mixed',
                },
            },
            repetitionsByDimension: {
                'babyPostnatal.infantFeeding': {
                    mostRecent: 3,
                    oldest: 0,
                },
            },
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'enrollmentOu',
                    'bcgDoses',
                    'lastName',
                    'enrollmentDate',
                    'programStatus',
                    'birth.infantFeeding',
                    'babyPostnatal.infantFeeding',
                ],
                rows: [],
                filters: [],
            },
            outputType: 'ENROLLMENT',
        },
    },
    lineListEvent: {
        input: {
            type: 'LINE_LIST',
            outputType: 'EVENT',
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    filter: 'ILIKE:je',
                    dimension: 'firstName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_INDICATOR',
                    items: [],
                    dimension: 'bcgDoses',
                },
                {
                    dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                    items: [
                        {
                            id: 'privateClinic',
                        },
                        {
                            id: 'publicFacility',
                        },
                    ],
                    dimension: 'facilityOwnership',
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                enrollmentOu: ['USER_ORGUNIT'],
                enrollmentDate: [],
                firstName: [],
                bcgDoses: [],
                facilityOwnership: ['privateClinic', 'publicFacility'],
            },
            conditionsByDimension: {
                firstName: {
                    condition: 'ILIKE:je',
                },
            },
            repetitionsByDimension: {},
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'enrollmentOu',
                    'enrollmentDate',
                    'firstName',
                    'bcgDoses',
                    'facilityOwnership',
                ],
                rows: [],
                filters: [],
            },
            outputType: 'EVENT',
        },
    },
    lineListTrackedEntity: {
        input: {
            type: 'LINE_LIST',
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: 'tetA', name: 'Person' },
            rows: [],
            columns: [
                {
                    dimensionType: 'ORGANISATION_UNIT',
                    items: [
                        {
                            id: 'USER_ORGUNIT',
                        },
                    ],
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'focusName',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    dimension: 'localFocusId',
                    valueType: 'TEXT',
                },
                {
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    items: [],
                    filter: 'GT:100',
                    dimension: 'area',
                    valueType: 'NUMBER',
                },
                {
                    dimensionType: 'ORGANISATION_UNIT',
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
                        id: 'incidentDateId',
                    },
                    dimension: 'ou',
                },
                {
                    dimensionType: 'PERIOD',
                    items: [],
                    program: {
                        id: 'incidentDateId',
                    },
                    dimension: 'enrollmentDate',
                },
                {
                    dimensionType: 'DATA_ELEMENT',
                    items: [],
                    programStage: {
                        id: 'dateOfFociRegistrationId',
                    },
                    program: {
                        id: 'incidentDateId',
                    },
                    dimension: 'focusDateOfClassification',
                    valueType: 'DATE',
                },
            ],
            filters: [],
        },
        expected: {
            itemsByDimension: {
                'tetA.enrollmentOu': ['USER_ORGUNIT'],
                'tetA.focusName': [],
                'tetA.localFocusId': [],
                'tetA.area': [],
                'incidentDateId.enrollmentOu': [
                    'bombali',
                    'bonthe',
                    'bo',
                    'kailahun',
                ],
                'incidentDateId.enrollmentDate': [],
                'incidentDateId.dateOfFociRegistrationId.focusDateOfClassification':
                    [],
            },
            conditionsByDimension: {
                'tetA.area': {
                    condition: 'GT:100',
                },
            },
            repetitionsByDimension: {},
            visualizationType: 'LINE_LIST',
            layout: {
                columns: [
                    'tetA.enrollmentOu',
                    'tetA.focusName',
                    'tetA.localFocusId',
                    'tetA.area',
                    'incidentDateId.enrollmentOu',
                    'incidentDateId.enrollmentDate',
                    'incidentDateId.dateOfFociRegistrationId.focusDateOfClassification',
                ],
                rows: [],
                filters: [],
            },
            outputType: 'TRACKED_ENTITY_INSTANCE',
        },
    },
}

describe('getVisualizationUiConfig', () => {
    it.each(Object.entries(testCases))(
        'should return correct config for %s visualization',
        (_name, { input, expected }) => {
            const result = getVisualizationUiConfig(
                input as unknown as SavedVisualization
            )
            expect(result).toEqual({ ...expected, options: DEFAULT_OPTIONS })
        }
    )

    it('extracts option fields from the saved vis and overrides the base options', () => {
        const input = {
            type: 'LINE_LIST',
            outputType: 'EVENT',
            rows: [],
            columns: [],
            filters: [],
            hideTitle: true,
            title: 'My Saved Title',
            fontSize: 'LARGE',
        } as unknown as SavedVisualization

        const baseOptions = {
            ...DEFAULT_OPTIONS,
            digitGroupSeparator: 'COMMA' as const,
            hideTitle: false,
        }

        const result = getVisualizationUiConfig(input, baseOptions)

        expect(result.options).toEqual({
            ...baseOptions,
            hideTitle: true,
            title: 'My Saved Title',
            fontSize: 'LARGE',
        })
    })
})

describe('getSaveableVisualization', () => {
    it('strips dimensionType and valueType from columns and filters', () => {
        const vis = {
            columns: [
                {
                    dimension: 'a',
                    dimensionType: 'SOME_TYPE',
                    valueType: 'TEXT',
                },
            ],
            rows: [],
            filters: [
                {
                    dimension: 'b',
                    dimensionType: 'OTHER',
                    valueType: 'NUMBER',
                },
            ],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)

        expect(saved.columns).toBeDefined()
        const col0 = (saved.columns as Array<Record<string, unknown>>)[0]
        expect(col0.dimension).toBe('a')
        expect('dimensionType' in col0).toBe(false)
        expect('valueType' in col0).toBe(false)

        expect(saved.filters).toBeDefined()
        const filt0 = (saved.filters as Array<Record<string, unknown>>)[0]
        expect(filt0.dimension).toBe('b')
        expect('dimensionType' in filt0).toBe(false)
        expect('valueType' in filt0).toBe(false)
    })

    it('removes legacy property before saving', () => {
        const vis = {
            legacy: true,
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)
        expect('legacy' in (saved as Record<string, unknown>)).toBe(false)
    })

    it('uses only the first sorting item and uppercases the direction', () => {
        const vis = {
            sorting: [
                { dimension: 'someDim', direction: 'desc' },
                { dimension: 'other', direction: 'asc' },
            ],
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.sorting).toBeDefined()
        expect(saved.sorting as Array<Record<string, unknown>>).toHaveLength(1)
        const s0 = (saved.sorting as Array<Record<string, unknown>>)[0]
        expect(s0.dimension).toBe('someDim')
        expect(s0.direction).toBe('DESC')
    })

    it('sets sorting to undefined when sorting is not provided or empty', () => {
        const vis1 = {
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization
        const vis2 = {
            sorting: [],
            columns: [],
            rows: [],
            filters: [],
        } as unknown as SavedVisualization

        const saved1 = getSaveableVisualization(vis1)
        const saved2 = getSaveableVisualization(vis2)

        expect(saved1.sorting).toBeUndefined()
        expect(saved2.sorting).toBeUndefined()
    })
})

describe('normalizeApiSavedVisualization', () => {
    const buildApiVis = (
        overrides: Partial<ApiSavedVisualization> = {}
    ): ApiSavedVisualization =>
        ({
            type: 'LINE_LIST',
            outputType: 'EVENT',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [],
            ...overrides,
        }) as unknown as ApiSavedVisualization

    const dimensionsOf = (vis: SavedVisualization): string[] =>
        [
            ...(vis.columns ?? []),
            ...(vis.rows ?? []),
            ...(vis.filters ?? []),
        ].map((dim) => dim.dimension)

    it.each(['dy', 'latitude', 'longitude'])(
        'drops the wire-only %s dimension and marks the vis legacy',
        (wireOnlyId) => {
            const result = normalizeApiSavedVisualization(
                buildApiVis({
                    rows: [
                        { dimension: wireOnlyId },
                        { dimension: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                    ] as ApiSavedVisualization['rows'],
                })
            )

            expect(dimensionsOf(result)).toEqual(['ou'])
            expect(result.legacy).toBe(true)
        }
    )

    it('does not mark a vis legacy when it carries no wire-only dimension', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                rows: [
                    { dimension: 'ou', dimensionType: 'ORGANISATION_UNIT' },
                ] as ApiSavedVisualization['rows'],
            })
        )

        expect(dimensionsOf(result)).toEqual(['ou'])
        expect(result.legacy).toBeUndefined()
    })

    it.each([
        ['createdDate', 'created'],
        ['completedDate', 'completed'],
        ['lastUpdatedOn', 'lastUpdated'],
    ])('renames %s to %s and marks the vis legacy', (oldId, newId) => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                columns: [
                    { dimension: oldId, dimensionType: 'PERIOD' },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toContain(newId)
        expect(dimensionsOf(result)).not.toContain(oldId)
        expect(result.legacy).toBe(true)
    })

    it('leaves a canonical vis untouched and does not mark it legacy', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                columns: [
                    {
                        dimension: 'created',
                        dimensionType: 'PERIOD',
                        programStage: { id: SID },
                    },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toEqual(['created'])
        expect(result.legacy).toBeUndefined()
    })

    it('marks legacy when top-level program/programStage is present', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                program: { id: PID },
                programStage: { id: SID },
                columns: [
                    { dimension: UID, dimensionType: 'DATA_ELEMENT' },
                ] as ApiSavedVisualization['columns'],
            } as Partial<ApiSavedVisualization>)
        )

        expect(result.legacy).toBe(true)
    })

    it('marks legacy when a `pe` dimension is converted to a time dimension', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                outputType: 'EVENT',
                columns: [
                    { dimension: 'pe', dimensionType: 'PERIOD' },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toContain('eventDate')
        expect(result.legacy).toBe(true)
    })

    it('marks legacy when an `orgUnitField` is converted to an ou filter', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                orgUnitField: 'someOuField',
            } as Partial<ApiSavedVisualization>)
        )

        expect(dimensionsOf(result)).toContain('ou')
        expect(result.legacy).toBe(true)
    })

    it('marks legacy when a top-level `programStatus` is converted to a filter', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                programStatus: 'COMPLETED',
            } as Partial<ApiSavedVisualization>)
        )

        expect(dimensionsOf(result)).toContain('programStatus')
        expect(result.legacy).toBe(true)
    })

    it('honours an explicit incoming legacy flag', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({ legacy: true } as Partial<ApiSavedVisualization>)
        )

        expect(result.legacy).toBe(true)
    })

    it('upgrades a legacy EVENT+LINE_LIST enrollment `ou` to `enrollmentOu`', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                type: 'LINE_LIST',
                outputType: 'EVENT',
                columns: [
                    {
                        dimension: 'ou',
                        dimensionType: 'ORGANISATION_UNIT',
                        program: { id: PID },
                    },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toEqual(['enrollmentOu'])
        expect(result.legacy).toBe(true)
    })

    it('leaves ENROLLMENT enrollment `ou` as `ou`', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                type: 'LINE_LIST',
                outputType: 'ENROLLMENT',
                columns: [
                    {
                        dimension: 'ou',
                        dimensionType: 'ORGANISATION_UNIT',
                        program: { id: PID },
                    },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toEqual(['ou'])
    })

    it('leaves the stage event `ou` (with programStage) as `ou`', () => {
        const result = normalizeApiSavedVisualization(
            buildApiVis({
                type: 'LINE_LIST',
                outputType: 'EVENT',
                columns: [
                    {
                        dimension: 'ou',
                        dimensionType: 'ORGANISATION_UNIT',
                        program: { id: PID },
                        programStage: { id: SID },
                    },
                ] as ApiSavedVisualization['columns'],
            })
        )

        expect(dimensionsOf(result)).toEqual(['ou'])
    })
})

describe('getVisualizationState treats default-valued options as unchanged', () => {
    /* The API sends real option values, not a sparse object. digitGroupSeparator
     * is the case that matters: the API sends a value where our default is
     * undefined, and the two must still compare as equal. */
    const apiDefaultOptions: Partial<EventVisualizationOptions> = {
        ...DEFAULT_OPTIONS,
        digitGroupSeparator: 'SPACE',
    }

    const buildApiVis = (
        options: Partial<EventVisualizationOptions> = apiDefaultOptions
    ): ApiSavedVisualization =>
        ({
            type: 'LINE_LIST',
            outputType: 'EVENT',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [],
            ...options,
        }) as unknown as ApiSavedVisualization

    /* Rebuild currentVis the way the app does: derive a visUiConfig from the
     * loaded vis, then run the real buildCurrentVisFromVisUiConfig (the same
     * function the update thunk uses) so this test can't drift from the app.
     * Dimensions are empty, so an empty metadata store suffices and any diff
     * can only come from options. `instanceDefaults` stands in for the
     * systemSetting-seeded base options. */
    const rebuildCurrentVis = (
        savedVis: SavedVisualization,
        instanceDefaults: EventVisualizationOptions = DEFAULT_OPTIONS
    ): CurrentVisualization => {
        const baseline = toCurrentVis(savedVis)
        return buildCurrentVisFromVisUiConfig({
            previousCurrentVis: baseline,
            visUiConfig: getVisualizationUiConfig(baseline, instanceDefaults),
            metadataStore: new MetadataStore({}),
        })
    }

    it('stays SAVED for a freshly loaded vis carrying default-valued options', () => {
        const savedVis = normalizeApiSavedVisualization(buildApiVis())

        const currentVis = rebuildCurrentVis(savedVis)

        expect(getVisualizationState(savedVis, currentVis)).toBe('SAVED')
    })

    it('stays SAVED when a non-default option is set', () => {
        const savedVis = normalizeApiSavedVisualization(
            buildApiVis({
                ...apiDefaultOptions,
                showData: true,
                displayDensity: 'COMFORTABLE',
            })
        )

        const currentVis = rebuildCurrentVis(savedVis)

        expect(getVisualizationState(savedVis, currentVis)).toBe('SAVED')
    })

    it('stays SAVED when the instance separator changed after the vis was saved', () => {
        const savedVis = normalizeApiSavedVisualization(
            buildApiVis({ ...apiDefaultOptions, digitGroupSeparator: 'COMMA' })
        )

        /* The vis keeps the separator seeded at creation (COMMA); it does not
         * follow the instance default, now SPACE — so it stays SAVED. */
        const instanceDefaults = getDefaultOptions('SPACE')
        const currentVis = rebuildCurrentVis(savedVis, instanceDefaults)

        expect(currentVis.digitGroupSeparator).toBe('COMMA')
        expect(getVisualizationState(savedVis, currentVis)).toBe('SAVED')
    })

    it('is DIRTY when a real option changes', () => {
        const savedVis = normalizeApiSavedVisualization(buildApiVis())

        const currentVis = {
            ...rebuildCurrentVis(savedVis),
            showData: true,
        }

        expect(getVisualizationState(savedVis, currentVis)).toBe('DIRTY')
    })
})

describe('getVisualizationState ignores non-persisted dimension props', () => {
    const base = {
        type: 'LINE_LIST',
        outputType: 'EVENT',
        rows: [],
        filters: [],
    }

    it('is SAVED when dims differ only by dimensionType/valueType', () => {
        const savedVis = {
            ...base,
            columns: [
                {
                    dimension: 'de1',
                    dimensionType: 'PROGRAM_DATA_ELEMENT',
                    program: { id: 'p1' },
                    programStage: { id: 's1' },
                },
            ],
        } as unknown as SavedVisualization
        const currentVis = {
            ...base,
            columns: [
                {
                    dimension: 'de1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                    program: { id: 'p1' },
                    programStage: { id: 's1' },
                },
            ],
        } as unknown as CurrentVisualization

        expect(getVisualizationState(savedVis, currentVis)).toBe('SAVED')
    })

    it('is DIRTY when the dimension itself changes', () => {
        const savedVis = {
            ...base,
            columns: [
                { dimension: 'de1', dimensionType: 'PROGRAM_DATA_ELEMENT' },
            ],
        } as unknown as SavedVisualization
        const currentVis = {
            ...base,
            columns: [{ dimension: 'de2', dimensionType: 'DATA_ELEMENT' }],
        } as unknown as CurrentVisualization

        expect(getVisualizationState(savedVis, currentVis)).toBe('DIRTY')
    })
})

describe('isDefaultOptionValue', () => {
    it('treats absent (undefined) as default', () => {
        expect(isDefaultOptionValue('showData', undefined)).toBe(true)
    })

    it('treats a value equal to the default as default', () => {
        // DEFAULT_OPTIONS.showData is false
        expect(isDefaultOptionValue('showData', false)).toBe(true)
    })

    it('treats a value differing from the default as non-default', () => {
        expect(isDefaultOptionValue('showData', true)).toBe(false)
    })

    it('treats any concrete digitGroupSeparator as non-default (its default is undefined)', () => {
        expect(isDefaultOptionValue('digitGroupSeparator', undefined)).toBe(
            true
        )
        expect(isDefaultOptionValue('digitGroupSeparator', 'SPACE')).toBe(false)
    })

    it('treats a populated legend as non-default (default legend is undefined)', () => {
        expect(
            isDefaultOptionValue('legend', {
                showKey: false,
                strategy: 'BY_DATA_ITEM',
                style: 'FILL',
            })
        ).toBe(false)
    })
})
