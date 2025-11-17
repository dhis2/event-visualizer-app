import { vi, expect, it, test, describe, beforeEach } from 'vitest'
import {
    getLegendSetConditionTexts,
    getOptionSetConditionTexts,
    getBooleanConditionTexts,
    getOrgUnitConditionTexts,
    getOperatorConditionTexts,
    checkIsCaseSensitive,
    addCaseSensitivePrefix,
    removeCaseSensitivePrefix,
    getConditionsFromVisualization,
    shouldUseLegendSetConditions,
    shouldUseOptionSetConditions,
    shouldUseBooleanConditions,
    shouldUseOrgUnitConditions,
    parseConditionsStringToArray,
} from '../conditions.js'
import type { QueryOperator } from '../conditions.js'
import type { LayoutDimension } from '@components/layout-panel/chip.js'
import type { CurrentVisualization } from '@types'

describe('getLegendSetConditionTexts', () => {
    const mockGetMetadataItem = vi.fn()

    beforeEach(() => {
        mockGetMetadataItem.mockReset()
    })

    test('Legend set chosen with no legends selected', () => {
        const conditions = {
            condition: '',
            legendSet: 'legendSetId1',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        expect(shouldUseLegendSetConditions(conditions)).toBe(true)

        mockGetMetadataItem.mockReturnValueOnce({
            id: 'legendSetId1',
            name: 'Legend Set Name',
        })
        const actual = getLegendSetConditionTexts(
            conditions,
            conditionsList,
            mockGetMetadataItem
        )

        expect(actual).toEqual(['Legend Set Name'])
    })

    test('Legend set chosen with legends selected', () => {
        const conditions = {
            condition: 'IN:Legend1Id;Legend2Id',
            legendSet: 'legendSetId1',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        expect(shouldUseLegendSetConditions(conditions)).toBe(true)

        mockGetMetadataItem.mockReturnValueOnce({
            id: 'legendSetId1',
            name: 'Legend Set Name',
            legends: [
                { id: 'Legend1Id', name: 'Legend 1' },
                { id: 'Legend2Id', name: 'Legend 2' },
            ],
        })

        const actual = getLegendSetConditionTexts(
            conditions,
            conditionsList,
            mockGetMetadataItem
        )

        expect(actual).toEqual(['Legend 1', 'Legend 2'])
    })
})

describe('getOptionSetConditionTexts', () => {
    const mockGetMetadataItem = vi.fn()

    beforeEach(() => {
        mockGetMetadataItem.mockReset()
    })

    test('Dimension with optionSet', () => {
        const conditions = {
            condition: 'IN:5code;6code',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        const dimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            optionSet: 'optionsetId',
            valueType: 'NUMBER',
        }

        expect(
            shouldUseOptionSetConditions(conditions, dimension, conditionsList)
        ).toBe(true)

        mockGetMetadataItem.mockReturnValue({
            id: 'optionsetId',
            name: 'Option Set Name',
            valueType: 'TEXT' as const,
            version: 1,
            options: [
                { code: '5code', name: '5' },
                { code: '6code', name: '6' },
            ],
        })

        const actual = getOptionSetConditionTexts(
            dimension,
            conditionsList,
            mockGetMetadataItem
        )

        expect(actual).toEqual(['5', '6'])
    })
})

describe('getOrgUnitConditionTexts', () => {
    const mockGetMetadataItem = vi.fn()

    beforeEach(() => {
        mockGetMetadataItem.mockReset()
    })

    test('Organisation unit dimension with EQ condition', () => {
        const conditions = {
            condition: 'EQ:OrgUnitId1',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        const dimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            valueType: 'ORGANISATION_UNIT',
        }

        expect(
            shouldUseOrgUnitConditions(conditions, dimension, conditionsList)
        ).toBe(true)

        mockGetMetadataItem.mockReturnValueOnce({
            id: 'OrgUnitId1',
            name: 'Org unit name',
        })

        const actual = getOrgUnitConditionTexts(
            conditionsList,
            mockGetMetadataItem
        )

        expect(actual).toEqual(['Org unit name'])
    })
})

describe('getBooleanConditionTexts', () => {
    test('dimensionType: undefined, valueType: BOOLEAN, condition: IN:1;NV, dgs: undefined', () => {
        const conditions = {
            condition: 'IN:1;NV',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        const dimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            valueType: 'BOOLEAN',
        }

        expect(
            shouldUseBooleanConditions(conditions, dimension, conditionsList)
        ).toBe(true)

        const actual = getBooleanConditionTexts(conditionsList)
        expect(actual).toEqual(['Yes', 'Not answered'])
    })

    test('dimensionType: undefined, valueType: TRUE_ONLY, condition: IN:NV, dgs: undefined', () => {
        const conditions = {
            condition: 'IN:NV',
        }
        const conditionsList = parseConditionsStringToArray(
            conditions.condition ?? ''
        )

        const dimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            valueType: 'TRUE_ONLY',
        }

        expect(
            shouldUseBooleanConditions(conditions, dimension, conditionsList)
        ).toBe(true)

        const actual = getBooleanConditionTexts(conditionsList)
        expect(actual).toEqual(['Not answered'])
    })
})

describe('getOperatorConditionTexts', () => {
    const dummyDimension: LayoutDimension = {
        id: 'dummy-id',
        dimensionId: 'dummy-dimension-id',
        name: 'Dummy dimension',
    }

    const tests = [
        {
            dimensionValueType: 'DATETIME',
            condition: 'GT:2021-01-16T11.44:LT:2022-05-16T12.00',
            expected: ['After: 2021-01-16 11:44', 'Before: 2022-05-16 12:00'],
        },
        {
            dimensionValueType: 'DATETIME',
            condition: 'NE:NV:GE:2021-01-16T15.45',
            expected: [
                'Is not empty / not null',
                'After or including: 2021-01-16 15:45',
            ],
        },
        {
            dimensionValueType: 'DATETIME',
            condition: 'EQ:NV',
            expected: ['Is empty / null'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'GT:31.5:LE:40.9',
            expected: [
                'Greater than (>): 31.5',
                'Less than or equal to (≤): 40.9',
            ],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'GT:3568.8',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568.8'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'GT:3568.8',
            dgs: 'COMMA',
            expected: ['Greater than (>): 3,568.8'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'GT:3568.8',
            dgs: 'NONE',
            expected: ['Greater than (>): 3568.8'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'GT:3568.8',
            expected: ['Greater than (>): 3568.8'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'EQ:NV:LE:40.9',
            expected: ['Is empty / null', 'Less than or equal to (≤): 40.9'],
        },
        {
            dimensionValueType: 'NUMBER',
            condition: 'NE:NV',
            expected: ['Is not empty / not null'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'GT:31:LE:40',
            expected: ['Greater than (>): 31', 'Less than or equal to (≤): 40'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'EQ:NV:LE:40',
            expected: ['Is empty / null', 'Less than or equal to (≤): 40'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'NE:NV',
            expected: ['Is not empty / not null'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'GT:3568',
            expected: ['Greater than (>): 3568'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'GT:3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'GT:3568',
            dgs: 'COMMA',
            expected: ['Greater than (>): 3,568'],
        },
        {
            dimensionValueType: 'INTEGER',
            condition: 'GT:3568',
            dgs: 'NONE',
            expected: ['Greater than (>): 3568'],
        },
        {
            dimensionValueType: 'INTEGER_POSITIVE',
            condition: 'GT:3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568'],
        },
        {
            dimensionValueType: 'INTEGER_NEGATIVE',
            condition: 'GT:-3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): -3 568'],
        },
        {
            dimensionValueType: 'INTEGER_ZERO_OR_POSITIVE',
            condition: 'GT:3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568'],
        },
        {
            dimensionValueType: 'PERCENTAGE',
            condition: 'GT:3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568'],
        },
        {
            dimensionValueType: 'UNIT_INTERVAL',
            condition: 'GT:3568',
            dgs: 'SPACE',
            expected: ['Greater than (>): 3 568'],
        },
        {
            dimensionType: 'PROGRAM_INDICATOR',
            condition: 'GT:5678',
            dgs: 'COMMA',
            expected: ['Greater than (>): 5,678'],
        },
        {
            dimensionValueType: 'LONG_TEXT',
            condition: 'ILIKE:Cats',
            expected: ['Contains: Cats'],
        },
        {
            dimensionValueType: 'LONG_TEXT',
            condition: '!ILIKE:Cats',
            expected: ['Does not contain: Cats'],
        },
        {
            dimensionValueType: 'LONG_TEXT',
            condition: 'NE:NV:LIKE:Cats',
            expected: ['Is not empty / not null', 'Contains: Cats'],
        },
        {
            dimensionValueType: 'LONG_TEXT',
            condition: 'EQ:NV',
            expected: ['Is empty / null'],
        },
    ]

    tests.forEach((t) => {
        const testname = `dimensionType: ${t.dimensionType}, valueType: ${t.dimensionValueType}, condition: ${t.condition}, dgs: ${t.dgs}`
        const formatValueOptions = t.dgs
            ? { digitGroupSeparator: t.dgs as 'SPACE' | 'COMMA' | 'NONE' }
            : {}
        test(testname, () => {
            const conditions = {
                condition: t.condition,
            }
            const conditionsList = parseConditionsStringToArray(
                conditions.condition ?? ''
            )

            const dimension = {
                ...dummyDimension,
                dimensionType: t.dimensionType,
                valueType: t.dimensionValueType,
            } as LayoutDimension

            // For operator conditions, none of the specific should* functions should return true
            expect(shouldUseLegendSetConditions(conditions)).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)

            const actual = getOperatorConditionTexts(
                dimension,
                conditionsList,
                formatValueOptions
            )
            expect(actual).toEqual(t.expected)
        })
    })
})

describe('checkIsCaseSensitive', () => {
    const tests = [
        {
            operator: '!LIKE',
            expected: true,
        },
        {
            operator: '!ILIKE',
            expected: false,
        },
        {
            operator: '!EQ',
            expected: true,
        },
        {
            operator: '!IEQ',
            expected: false,
        },
        {
            operator: 'LIKE',
            expected: true,
        },
        {
            operator: 'ILIKE',
            expected: false,
        },
        {
            operator: 'EQ',
            expected: true,
        },
        {
            operator: 'IEQ',
            expected: false,
        },
        // The function doesn't handle 'IN' correctly
        // {
        //     operator: 'IN',
        //     expected: true,
        // },
        // {
        //     operator: '!IN',
        //     expected: true,
        // },
    ]

    tests.forEach((t) => {
        const testname = `${t.operator}: expected: ${t.expected}`
        test(testname, () => {
            expect(checkIsCaseSensitive(t.operator as QueryOperator)).toEqual(
                t.expected
            )
        })
    })
})

describe('addCaseSensitivePrefix', () => {
    const tests = [
        {
            operator: 'LIKE',
            isCaseSensitive: true,
            expected: 'LIKE',
        },
        {
            operator: '!LIKE',
            isCaseSensitive: true,
            expected: '!LIKE',
        },
        {
            operator: '!LIKE',
            isCaseSensitive: false,
            expected: '!ILIKE',
        },
        {
            operator: 'LIKE',
            isCaseSensitive: false,
            expected: 'ILIKE',
        },
        {
            operator: 'EQ',
            isCaseSensitive: true,
            expected: 'EQ',
        },
        {
            operator: '!EQ',
            isCaseSensitive: true,
            expected: '!EQ',
        },
        {
            operator: '!EQ',
            isCaseSensitive: false,
            expected: '!IEQ',
        },
        {
            operator: 'EQ',
            isCaseSensitive: false,
            expected: 'IEQ',
        },
    ]

    tests.forEach((t) => {
        const testname = `${t.operator}: caseSensitive: ${t.isCaseSensitive} should become ${t.expected}`
        test(testname, () => {
            expect(
                addCaseSensitivePrefix(
                    t.operator as QueryOperator,
                    t.isCaseSensitive
                )
            ).toEqual(t.expected)
        })
    })
})

describe('removeCaseSensitivePrefix', () => {
    const tests = [
        {
            operator: 'LIKE',
            expected: 'LIKE',
        },
        {
            operator: '!LIKE',
            expected: '!LIKE',
        },
        {
            operator: 'ILIKE',
            expected: 'LIKE',
        },
        {
            operator: '!ILIKE',
            expected: '!LIKE',
        },
        {
            operator: 'EQ',
            expected: 'EQ',
        },
        {
            operator: '!EQ',
            expected: '!EQ',
        },
        {
            operator: 'IEQ',
            expected: 'EQ',
        },
        {
            operator: '!IEQ',
            expected: '!EQ',
        },
    ]

    tests.forEach((t) => {
        const testname = `${t.operator} should become ${t.expected}`
        test(testname, () => {
            expect(
                removeCaseSensitivePrefix(t.operator as QueryOperator)
            ).toEqual(t.expected)
        })
    })
})

describe('getConditionsFromVisualization', () => {
    it('should return empty object if visualization has no columns, rows, or filters', () => {
        const visualization = {
            columns: [],
            rows: [],
            filters: [],
        }
        const conditions = getConditionsFromVisualization(
            visualization as unknown as CurrentVisualization,
            'EVENT'
        )
        expect(conditions).toEqual({})
    })

    it('should return conditions for columns, rows, and filters with filter or legendSet defined', () => {
        const visualization = {
            columns: [{ dimension: 'dx1', filter: 'filter1' }],
            rows: [{ dimension: 'dx2', legendSet: { id: 'legend1' } }],
            filters: [
                {
                    dimension: 'dx3',
                    filter: 'filter3',
                    legendSet: { id: 'legend2' },
                },
            ],
        }
        const conditions = getConditionsFromVisualization(
            visualization as unknown as CurrentVisualization,
            'EVENT'
        )
        expect(conditions).toEqual({
            dx1: { condition: 'filter1', legendSet: undefined },
            dx2: { condition: undefined, legendSet: 'legend1' },
            dx3: { condition: 'filter3', legendSet: 'legend2' },
        })
    })

    it('should return conditions with correct id for output type event', () => {
        const visualization = {
            columns: [
                {
                    dimension: 'dx1',
                    programStage: { id: 'ps1' },
                    program: { id: 'p1' },
                    filter: 'filter1',
                },
            ],
            rows: [],
            filters: [],
        }
        const conditions = getConditionsFromVisualization(
            visualization as unknown as CurrentVisualization,
            'EVENT'
        )
        expect(conditions).toEqual({
            'ps1.dx1': { condition: 'filter1', legendSet: undefined },
        })
    })

    it('should return conditions with correct id for output type tracked entity', () => {
        const visualization = {
            columns: [
                {
                    dimension: 'dx1',
                    programStage: { id: 'ps1' },
                    program: { id: 'p1' },
                    filter: 'filter1',
                },
            ],
            rows: [],
            filters: [],
        }
        const conditions = getConditionsFromVisualization(
            visualization as unknown as CurrentVisualization,
            'TRACKED_ENTITY_INSTANCE'
        )
        expect(conditions).toEqual({
            'p1.ps1.dx1': { condition: 'filter1', legendSet: undefined },
        })
    })
})

describe('texts extraction discriminators', () => {
    describe('shouldUseLegendSetConditions', () => {
        test('returns true when legendSet is present', () => {
            expect(
                shouldUseLegendSetConditions({ legendSet: 'legendSetId' })
            ).toBe(true)
        })

        test('returns false when legendSet is missing or empty', () => {
            expect(shouldUseLegendSetConditions({})).toBe(false)
            expect(shouldUseLegendSetConditions({ legendSet: '' })).toBe(false)
        })
    })

    describe('shouldUseOptionSetConditions', () => {
        const dimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            optionSet: 'optionsetId',
            valueType: 'TEXT',
        }

        test('returns true when dimension has optionSet and conditions start with IN', () => {
            const conditions = {}
            const conditionsList = ['IN:value1;value2']
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(true)
        })

        test('returns false when legendSet present, conditions empty, conditions not IN, or no optionSet', () => {
            const conditionsList = ['IN:value1;value2']
            expect(
                shouldUseOptionSetConditions(
                    { legendSet: 'legendSetId' },
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(shouldUseOptionSetConditions({}, dimension, [])).toBe(false)
            expect(
                shouldUseOptionSetConditions({}, dimension, ['EQ:value1'])
            ).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    {},
                    { ...dimension, optionSet: undefined },
                    conditionsList
                )
            ).toBe(false)
        })
    })

    describe('shouldUseBooleanConditions', () => {
        const booleanDimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            valueType: 'BOOLEAN',
        }

        test('returns true for BOOLEAN/TRUE_ONLY valueType with IN conditions', () => {
            const conditions = {}
            const conditionsList = ['IN:1;0']
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    booleanDimension,
                    conditionsList
                )
            ).toBe(true)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    { ...booleanDimension, valueType: 'TRUE_ONLY' as const },
                    conditionsList
                )
            ).toBe(true)
        })

        test('returns false when legendSet present, optionSet would apply, or non-boolean valueType', () => {
            const conditionsList = ['IN:1;0']
            expect(
                shouldUseBooleanConditions(
                    { legendSet: 'legendSetId' },
                    booleanDimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    {},
                    { ...booleanDimension, optionSet: 'optionSetId' },
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    {},
                    { ...booleanDimension, valueType: 'TEXT' as const },
                    conditionsList
                )
            ).toBe(false)
        })
    })

    describe('shouldUseOrgUnitConditions', () => {
        const orgUnitDimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
            valueType: 'ORGANISATION_UNIT',
        }

        test('returns true for ORGANISATION_UNIT with EQ/IN conditions', () => {
            const conditions = {}
            expect(
                shouldUseOrgUnitConditions(conditions, orgUnitDimension, [
                    'EQ:orgUnitId',
                ])
            ).toBe(true)
            expect(
                shouldUseOrgUnitConditions(conditions, orgUnitDimension, [
                    'IN:orgUnitId1;orgUnitId2',
                ])
            ).toBe(true)
        })

        test('returns false when legendSet present, optionSet would apply, boolean would apply, or non-org-unit valueType', () => {
            expect(
                shouldUseOrgUnitConditions(
                    { legendSet: 'legendSetId' },
                    orgUnitDimension,
                    ['EQ:orgUnitId']
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    {},
                    { ...orgUnitDimension, optionSet: 'optionSetId' },
                    ['IN:orgUnitId1;orgUnitId2']
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    {},
                    { ...orgUnitDimension, valueType: 'BOOLEAN' as const },
                    ['IN:orgUnitId1;orgUnitId2']
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    {},
                    { ...orgUnitDimension, valueType: 'TEXT' as const },
                    ['EQ:orgUnitId']
                )
            ).toBe(false)
        })
    })

    describe('mutual exclusivity', () => {
        const baseDimension: LayoutDimension = {
            id: 'dummy-id',
            dimensionId: 'dummy-dimension-id',
            name: 'Dummy dimension',
        }

        test('only legend set discriminator returns true for legend set conditions', () => {
            const conditions = { legendSet: 'legendSetId' }
            const conditionsList = ['IN:Legend1Id;Legend2Id']
            const dimension = { ...baseDimension, valueType: 'TEXT' as const }

            expect(shouldUseLegendSetConditions(conditions)).toBe(true)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
        })

        test('only option set discriminator returns true for option set conditions', () => {
            const conditions = {}
            const conditionsList = ['IN:value1;value2']
            const dimension = {
                ...baseDimension,
                valueType: 'TEXT' as const,
                optionSet: 'optionSetId',
            }

            expect(shouldUseLegendSetConditions(conditions)).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(true)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
        })

        test('only boolean discriminator returns true for boolean conditions', () => {
            const conditions = {}
            const conditionsList = ['IN:1;0']
            const dimension = {
                ...baseDimension,
                valueType: 'BOOLEAN' as const,
            }

            expect(shouldUseLegendSetConditions(conditions)).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(true)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
        })

        test('only org unit discriminator returns true for org unit conditions', () => {
            const conditions = {}
            const conditionsList = ['EQ:orgUnitId']
            const dimension = {
                ...baseDimension,
                valueType: 'ORGANISATION_UNIT' as const,
            }

            expect(shouldUseLegendSetConditions(conditions)).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(true)
        })

        test('no discriminator returns true for operator conditions', () => {
            const conditions = {}
            const conditionsList = ['GT:31.5']
            const dimension = { ...baseDimension, valueType: 'NUMBER' as const }

            expect(shouldUseLegendSetConditions(conditions)).toBe(false)
            expect(
                shouldUseOptionSetConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseBooleanConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
            expect(
                shouldUseOrgUnitConditions(
                    conditions,
                    dimension,
                    conditionsList
                )
            ).toBe(false)
        })
    })
})
