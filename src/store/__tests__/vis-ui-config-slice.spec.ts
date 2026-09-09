import { DEFAULT_OPTIONS } from '@constants/options'
import type { AppCachedData } from '@types'
import { describe, it, expect } from 'vitest'
import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigLayoutIsEmpty,
    getVisUiConfigPlainItemIdsByDimension,
    type VisUiConfigState,
} from '../vis-ui-config-slice'

type SystemDigitGroupSeparator =
    AppCachedData['systemSettings']['digitGroupSeparator']

const {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
    setVisUiConfigConditionsByDimension,
    setVisUiConfigGroupingByDimension,
    clearVisUiConfig,
} = visUiConfigSlice.actions

type RootState = { visUiConfig: VisUiConfigState }

const createRootState = (sliceState: Partial<VisUiConfigState>): RootState => ({
    visUiConfig: { ...initialState, ...sliceState },
})

const createStateWithLayout = (layout: typeof initialState.layout) => ({
    ...initialState,
    layout,
})

const TEST_SYSTEM_SETTINGS = {
    digitGroupSeparator: 'SPACE',
    relativePeriod: 'LAST_12_MONTHS',
} satisfies Partial<AppCachedData['systemSettings']>

/* createAppCachedDataMiddleware stamps appCachedData onto every action before
 * a reducer sees it, so reducers read it without guarding. Specs invoke
 * reducers directly and have to stamp it themselves. */
const withAppCachedData = <TAction extends { type: string }>(
    action: TAction,
    systemSettings: Partial<AppCachedData['systemSettings']> = {}
): TAction =>
    ({
        ...action,
        meta: {
            appCachedData: {
                systemSettings: { ...TEST_SYSTEM_SETTINGS, ...systemSettings },
            },
        },
    }) as TAction

describe('addVisUiConfigLayoutDimension', () => {
    it('adds to an empty axis', () => {
        const state = createStateWithLayout({
            columns: [],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'a1',
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1'])
    })

    it('appends to a populated axis when insertIndex is omitted', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'a3',
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })

    it('inserts before the provided index', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a3', 'a4'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'a2',
                insertIndex: 1,
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })

    it('inserts after the provided index when insertAfter is true', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2', 'a4'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'a3',
                insertIndex: 1,
                insertAfter: true,
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })
})

describe('addVisUiConfigLayoutDimensions', () => {
    it('adds multiple items to an empty axis', () => {
        const state = createStateWithLayout({
            columns: [],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: ['a1', 'a2', 'a3'],
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })

    it('appends to a populated axis when insertIndex is omitted', () => {
        const state = createStateWithLayout({
            columns: ['a1'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: ['a2', 'a3'],
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })

    it('inserts before the provided index', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a4'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: ['a2', 'a3'],
                insertIndex: 1,
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })

    it('inserts after the provided index when insertAfter is true', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: ['a3', 'a4'],
                insertIndex: 1,
                insertAfter: true,
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })

    it('handles a single-item array the same as the singular action', () => {
        const state = createStateWithLayout({
            columns: ['a1'],
            filters: [],
            rows: [],
        })
        const action = withAppCachedData(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: ['a2'],
            })
        )
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2'])
    })
})

describe('moveVisUiConfigLayoutDimension', () => {
    it('throws if the dimension is missing from the source axis', () => {
        const state = createStateWithLayout({
            columns: ['a1'],
            filters: ['b1'],
            rows: [],
        })
        const action = moveVisUiConfigLayoutDimension({
            dimensionId: 'b2',
            sourceAxis: 'filters',
            targetAxis: 'columns',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension b2 not found in source axis filters'
        )
    })

    describe('moving between axes', () => {
        it('appends to the end by default', () => {
            const state = createStateWithLayout({
                columns: ['a1'],
                filters: ['b1', 'b2'],
                rows: [],
            })
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'b1',
                sourceAxis: 'filters',
                targetAxis: 'columns',
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual(['a1', 'b1'])
            expect(result.layout.filters).toEqual(['b2'])
        })

        it('moves to the start when targetIndex is 0', () => {
            const state = createStateWithLayout({
                columns: ['a1', 'a2'],
                filters: ['b1', 'b2'],
                rows: [],
            })
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'b2',
                sourceAxis: 'filters',
                targetAxis: 'columns',
                targetIndex: 0,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual(['b2', 'a1', 'a2'])
            expect(result.layout.filters).toEqual(['b1'])
        })

        it('moves into the middle before the hovered dimension', () => {
            const state = createStateWithLayout({
                columns: ['a1', 'a3', 'a4'],
                filters: ['b1', 'b2'],
                rows: [],
            })
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'b1',
                sourceAxis: 'filters',
                targetAxis: 'columns',
                targetIndex: 1,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual(['a1', 'b1', 'a3', 'a4'])
            expect(result.layout.filters).toEqual(['b2'])
        })

        it('moves into the middle after the hovered dimension when insertAfter is true', () => {
            const state = createStateWithLayout({
                columns: ['a1', 'a3', 'a4'],
                filters: ['b1', 'b2'],
                rows: [],
            })
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'b2',
                sourceAxis: 'filters',
                targetAxis: 'columns',
                targetIndex: 0,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual(['a1', 'b2', 'a3', 'a4'])
            expect(result.layout.filters).toEqual(['b1'])
        })
    })

    describe('moving within the same axis', () => {
        const baseColumns = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const

        const buildState = () =>
            createStateWithLayout({
                columns: [...baseColumns],
                filters: [],
                rows: [],
            })

        it('moves from start to end when no targetIndex is provided', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c1',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c2',
                'c3',
                'c4',
                'c5',
                'c6',
                'c1',
            ])
        })

        it('moves from end to start when targetIndex is 0', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c6',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 0,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c6',
                'c1',
                'c2',
                'c3',
                'c4',
                'c5',
            ])
        })

        it('moves forward from index 1 to before index 3', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c2',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 3,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c1',
                'c3',
                'c2',
                'c4',
                'c5',
                'c6',
            ])
        })

        it('moves forward from index 1 to after index 3 when insertAfter is true', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c2',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 3,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c1',
                'c3',
                'c4',
                'c2',
                'c5',
                'c6',
            ])
        })

        it('moves backward from index 3 to before index 1', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c4',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 1,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c1',
                'c4',
                'c2',
                'c3',
                'c5',
                'c6',
            ])
        })

        it('moves backward from index 3 to after index 1 when insertAfter is true', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                dimensionId: 'c4',
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 1,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns).toEqual([
                'c1',
                'c2',
                'c4',
                'c3',
                'c5',
                'c6',
            ])
        })
    })
})

describe('removeVisUiConfigLayoutDimensionFromAxis', () => {
    it('removes the dimension when it exists', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2', 'a3'],
            filters: [],
            rows: [],
        })
        const action = removeVisUiConfigLayoutDimensionFromAxis({
            axis: 'columns',
            dimensionId: 'a2',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a3'])
    })

    it('throws when trying to delete a missing dimension', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2'],
            filters: [],
            rows: [],
        })
        const action = removeVisUiConfigLayoutDimensionFromAxis({
            axis: 'columns',
            dimensionId: 'a3',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension a3 not found in axis columns'
        )
    })
})

describe('getVisUiConfigLayoutIsEmpty', () => {
    it('returns true when all axes are empty', () => {
        const state = createRootState({
            layout: { columns: [], filters: [], rows: [] },
        })
        expect(getVisUiConfigLayoutIsEmpty(state)).toBe(true)
    })

    it('returns false when columns has a dimension', () => {
        const state = createRootState({
            layout: { columns: ['a1'], filters: [], rows: [] },
        })
        expect(getVisUiConfigLayoutIsEmpty(state)).toBe(false)
    })

    it('returns false when filters has a dimension', () => {
        const state = createRootState({
            layout: { columns: [], filters: ['f1'], rows: [] },
        })
        expect(getVisUiConfigLayoutIsEmpty(state)).toBe(false)
    })

    it('returns false when rows has a dimension', () => {
        const state = createRootState({
            layout: { columns: [], filters: [], rows: ['r1'] },
        })
        expect(getVisUiConfigLayoutIsEmpty(state)).toBe(false)
    })

    it('memoizes: returns the same reference when layout is unchanged', () => {
        const state = createRootState({
            layout: { columns: ['a1'], filters: [], rows: [] },
        })
        expect(getVisUiConfigLayoutIsEmpty(state)).toBe(
            getVisUiConfigLayoutIsEmpty(state)
        )
    })
})

describe('getVisUiConfigPlainItemIdsByDimension', () => {
    it('returns an empty array for an unknown dimensionId', () => {
        const state = createRootState({ itemsByDimension: {} })
        expect(getVisUiConfigPlainItemIdsByDimension(state, 'unknown')).toEqual(
            []
        )
    })

    it('strips the stage prefix and returns plain dimensionIds', () => {
        const state = createRootState({
            itemsByDimension: {
                'stage1.dim1': ['stage1.item1', 'stage1.item2'],
            },
        })
        expect(
            getVisUiConfigPlainItemIdsByDimension(state, 'stage1.dim1')
        ).toEqual(['item1', 'item2'])
    })

    it('passes through plain ids that have no prefix', () => {
        const state = createRootState({
            itemsByDimension: { dim1: ['item1', 'item2'] },
        })
        expect(getVisUiConfigPlainItemIdsByDimension(state, 'dim1')).toEqual([
            'item1',
            'item2',
        ])
    })

    it('memoizes: returns the same array reference when items are unchanged', () => {
        const state = createRootState({
            itemsByDimension: { 'stage1.dim1': ['stage1.item1'] },
        })
        const first = getVisUiConfigPlainItemIdsByDimension(
            state,
            'stage1.dim1'
        )
        const second = getVisUiConfigPlainItemIdsByDimension(
            state,
            'stage1.dim1'
        )
        expect(first).toBe(second)
    })
})

describe('seeding default items from the relative period in action meta', () => {
    it('seeds a time dimension with the default relative period', () => {
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'stage1.eventDate',
            }),
            { relativePeriod: 'THIS_YEAR' }
        )
        const result = visUiConfigSlice.reducer(initialState, action)
        expect(result.itemsByDimension['stage1.eventDate']).toEqual([
            'THIS_YEAR',
        ])
    })

    it('leaves a non-time, non-org-unit dimension unseeded', () => {
        const action = withAppCachedData(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'stage1.de1',
            })
        )
        const result = visUiConfigSlice.reducer(initialState, action)
        expect(result.itemsByDimension).not.toHaveProperty('stage1.de1')
    })
})

describe('grouping and filtering share one conditions entry', () => {
    const dimensionId = 'stage1.de1'
    const grouped: VisUiConfigState = {
        ...initialState,
        conditionsByDimension: {
            [dimensionId]: { condition: 'IN:LEGEND_1', legendSet: 'LS_1' },
        },
    }

    it('keeps the grouping when the filter changes', () => {
        const result = visUiConfigSlice.reducer(
            grouped,
            setVisUiConfigConditionsByDimension({
                dimensionId,
                conditions: 'IN:LEGEND_2',
            })
        )

        expect(result.conditionsByDimension[dimensionId]).toEqual({
            condition: 'IN:LEGEND_2',
            legendSet: 'LS_1',
        })
    })

    it('keeps the grouping when the filter is cleared', () => {
        const result = visUiConfigSlice.reducer(
            grouped,
            setVisUiConfigConditionsByDimension({ dimensionId, conditions: '' })
        )

        expect(result.conditionsByDimension[dimensionId]).toEqual({
            condition: '',
            legendSet: 'LS_1',
        })
    })

    it('drops the filter when the grouping changes', () => {
        const result = visUiConfigSlice.reducer(
            grouped,
            setVisUiConfigGroupingByDimension({
                dimensionId,
                legendSet: 'LS_2',
            })
        )

        expect(result.conditionsByDimension[dimensionId]).toEqual({
            legendSet: 'LS_2',
        })
    })

    it('drops the filter when the grouping is removed', () => {
        const result = visUiConfigSlice.reducer(
            grouped,
            setVisUiConfigGroupingByDimension({ dimensionId })
        )

        expect(result.conditionsByDimension[dimensionId]).toBeUndefined()
        /* The key stays so the default grouping is not seeded again over an
         * explicit "No grouping". */
        expect(dimensionId in result.conditionsByDimension).toBe(true)
    })

    it('clears the entry when an ungrouped filter is cleared', () => {
        const filteredOnly: VisUiConfigState = {
            ...initialState,
            conditionsByDimension: { [dimensionId]: { condition: 'EQ:5' } },
        }

        const result = visUiConfigSlice.reducer(
            filteredOnly,
            setVisUiConfigConditionsByDimension({ dimensionId, conditions: '' })
        )

        expect(result.conditionsByDimension[dimensionId]).toBeUndefined()
    })
})

const stateWithSeparator = (
    digitGroupSeparator: SystemDigitGroupSeparator
): VisUiConfigState => ({
    ...initialState,
    options: { ...initialState.options, digitGroupSeparator },
})

describe('clearVisUiConfig', () => {
    const clearedInitialState: VisUiConfigState = {
        ...initialState,
        options: {
            ...DEFAULT_OPTIONS,
            digitGroupSeparator: TEST_SYSTEM_SETTINGS.digitGroupSeparator,
        },
    }

    it('resets items and layout to the initial state', () => {
        const state = {
            ...initialState,
            itemsByDimension: { 'stage1.eventDate': ['LAST_12_MONTHS'] },
            layout: { columns: ['stage1.eventDate'], filters: [], rows: [] },
        }
        const result = visUiConfigSlice.reducer(
            state,
            withAppCachedData(clearVisUiConfig())
        )
        expect(result).toEqual(clearedInitialState)
    })

    it('keeps the current visualization type', () => {
        const state = {
            ...initialState,
            visualizationType: 'PIVOT_TABLE' as const,
            layout: { columns: ['stage1.eventDate'], filters: [], rows: [] },
        }
        const result = visUiConfigSlice.reducer(
            state,
            withAppCachedData(clearVisUiConfig())
        )

        expect(result).toEqual({
            ...clearedInitialState,
            visualizationType: 'PIVOT_TABLE',
        })
    })

    it('seeds the digit group separator from the system setting in action meta', () => {
        const result = visUiConfigSlice.reducer(
            initialState,
            withAppCachedData(clearVisUiConfig(), {
                digitGroupSeparator: 'SPACE',
            })
        )

        expect(result.options.digitGroupSeparator).toBe('SPACE')
    })

    /* The separator a saved visualization carried must not survive into the new
     * one: the instance setting is the default for every new visualization. */
    it('replaces the previous separator with the system setting', () => {
        const result = visUiConfigSlice.reducer(
            stateWithSeparator('COMMA'),
            withAppCachedData(clearVisUiConfig(), {
                digitGroupSeparator: 'SPACE',
            })
        )

        expect(result.options.digitGroupSeparator).toBe('SPACE')
    })

    it('resets the remaining options while seeding the separator', () => {
        const state: VisUiConfigState = {
            ...initialState,
            options: {
                ...initialState.options,
                digitGroupSeparator: 'COMMA',
                title: 'Kept from the previous visualization',
                cumulativeValues: true,
            },
        }

        const result = visUiConfigSlice.reducer(
            state,
            withAppCachedData(clearVisUiConfig(), {
                digitGroupSeparator: 'NONE',
            })
        )

        expect(result.options).toEqual({
            ...DEFAULT_OPTIONS,
            digitGroupSeparator: 'NONE',
        })
    })

    it('throws when the action never passed through the store middleware', () => {
        expect(() =>
            visUiConfigSlice.reducer(
                stateWithSeparator('COMMA'),
                clearVisUiConfig()
            )
        ).toThrow('carries no appCachedData')
    })
})
