import { describe, it, expect } from 'vitest'
import { visUiConfigSlice, initialState } from '../vis-ui-config-slice'
import type { Axis, LayoutDimension } from '@types'

const {
    addVisUiConfigLayoutDimension,
    updateVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} = visUiConfigSlice.actions

const {
    getVisUiConfigLayout,
    getVisUiConfigLayoutDimensionsForAxis,
    getVisUiConfigAllLayoutDimensions,
    getVisUiConfigLayoutDimension,
    getVisUiConfigLayoutDimensionItems,
    getVisUiConfigLayoutDimensionConditions,
    getVisUiConfigLayoutDimensionRepetitions,
} = visUiConfigSlice.selectors

// Helper to create dimensions with axis field for input
type DimensionWithAxis = LayoutDimension & { axis: Axis }

const createStateWithDimensions = (dimensions: DimensionWithAxis[]) => {
    // Group dimensions by axis
    const layout = {
        columns: dimensions.filter((d) => d.axis === 'columns'),
        rows: dimensions.filter((d) => d.axis === 'rows'),
        filters: dimensions.filter((d) => d.axis === 'filters'),
    }
    return {
        ...initialState,
        layout,
    }
}

const wrapStateForSelectors = (sliceState: typeof initialState) => ({
    visUiConfig: sliceState,
})

describe('addVisUiConfigLayoutDimension', () => {
    it('adds to an empty layout axis', () => {
        const state = createStateWithDimensions([])
        const action = addVisUiConfigLayoutDimension({
            id: 'dx',
            axis: 'columns',
            items: ['item1'],
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toHaveLength(1)
        expect(result.layout.columns[0]).toMatchObject({
            id: 'dx',
            items: ['item1'],
        })
    })

    it('appends to the end of the axis when insertIndex is omitted', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: ['item1'],
            },
            {
                id: 'pe',
                axis: 'columns',
                items: ['2024'],
            },
        ])
        const action = addVisUiConfigLayoutDimension({
            id: 'ou',
            axis: 'columns',
            items: ['orgUnit1'],
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toHaveLength(3)
        expect(result.layout.columns[2]).toMatchObject({
            id: 'ou',
        })
    })

    it('inserts before the provided index within the axis', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
            {
                id: 'ou',
                axis: 'columns',
                items: [],
            },
        ])
        const action = addVisUiConfigLayoutDimension({
            id: 'pe',
            axis: 'columns',
            items: [],
            insertIndex: 1,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns.map((d) => d.id)).toEqual([
            'dx',
            'pe',
            'ou',
        ])
    })

    it('inserts after the provided index when insertAfter is true', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
            {
                id: 'ou',
                axis: 'columns',
                items: [],
            },
        ])
        const action = addVisUiConfigLayoutDimension({
            id: 'pe',
            axis: 'columns',
            items: [],
            insertIndex: 0,
            insertAfter: true,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns.map((d) => d.id)).toEqual([
            'dx',
            'pe',
            'ou',
        ])
    })

    it('adds to a different axis without affecting other axes', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
            {
                id: 'pe',
                axis: 'rows',
                items: [],
            },
        ])
        const action = addVisUiConfigLayoutDimension({
            id: 'ou',
            axis: 'filters',
            items: [],
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toHaveLength(1)
        expect(result.layout.rows).toHaveLength(1)
        expect(result.layout.filters).toHaveLength(1)
        expect(result.layout.filters[0].id).toBe('ou')
    })

    it('preserves all dimension fields including conditions and repetitions', () => {
        const state = createStateWithDimensions([])
        const action = addVisUiConfigLayoutDimension({
            id: 'programStageDataElement.id',
            programId: 'prog1',
            programStageId: 'stage1',
            axis: 'columns',
            items: ['item1'],
            conditions: {
                condition: 'GT:5',
                legendSet: 'legend1',
            },
            repetitions: {
                mostRecent: 2,
                oldest: 1,
            },
            repetitionIndex: 0,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns[0]).toMatchObject({
            id: 'programStageDataElement.id',
            programId: 'prog1',
            programStageId: 'stage1',
            items: ['item1'],
            conditions: {
                condition: 'GT:5',
                legendSet: 'legend1',
            },
            repetitions: {
                mostRecent: 2,
                oldest: 1,
            },
            repetitionIndex: 0,
        })
    })
})

describe('updateVisUiConfigLayoutDimension', () => {
    it('updates items for a dimension', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: ['item1'],
            },
        ])
        const action = updateVisUiConfigLayoutDimension({
            identifier: { id: 'dx' },
            updates: { items: ['item1', 'item2'] },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns[0].items).toEqual(['item1', 'item2'])
    })

    it('updates conditions for a dimension', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
        ])
        const action = updateVisUiConfigLayoutDimension({
            identifier: { id: 'dx' },
            updates: {
                conditions: {
                    condition: 'GT:10',
                    legendSet: 'legend1',
                },
            },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns[0].conditions).toEqual({
            condition: 'GT:10',
            legendSet: 'legend1',
        })
    })

    it('updates repetitions for a dimension', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
        ])
        const action = updateVisUiConfigLayoutDimension({
            identifier: { id: 'dx' },
            updates: {
                repetitions: {
                    mostRecent: 3,
                    oldest: 2,
                },
            },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns[0].repetitions).toEqual({
            mostRecent: 3,
            oldest: 2,
        })
    })

    it('matches dimension with programId and programStageId', () => {
        const state = createStateWithDimensions([
            {
                id: 'dataElement1',
                programId: 'prog1',
                programStageId: 'stage1',
                axis: 'columns',
                items: [],
            },
            {
                id: 'dataElement1',
                programId: 'prog2',
                programStageId: 'stage2',
                axis: 'columns',
                items: [],
            },
        ])
        const action = updateVisUiConfigLayoutDimension({
            identifier: {
                id: 'dataElement1',
                programId: 'prog2',
                programStageId: 'stage2',
            },
            updates: { items: ['updated'] },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns[0].items).toEqual([])
        expect(result.layout.columns[1].items).toEqual(['updated'])
    })

    it('throws when dimension is not found', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
        ])
        const action = updateVisUiConfigLayoutDimension({
            identifier: { id: 'nonexistent' },
            updates: { items: [] },
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension not found'
        )
    })
})

describe('moveVisUiConfigLayoutDimension', () => {
    it('throws if the dimension does not exist', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
        ])
        const action = moveVisUiConfigLayoutDimension({
            identifier: { id: 'nonexistent' },
            sourceAxis: 'columns',
            targetAxis: 'rows',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Could not find dimension in layout'
        )
    })

    describe('moving between axes', () => {
        it('appends to the end of target axis by default', () => {
            const state = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'ou',
                    axis: 'rows',
                    items: [],
                },
            ])
            const action = moveVisUiConfigLayoutDimension({
                identifier: { id: 'dx' },
                sourceAxis: 'columns',
                targetAxis: 'rows',
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual(['pe'])
            expect(result.layout.rows.map((d) => d.id)).toEqual(['ou', 'dx'])
        })

        it('moves to the start of target axis when targetIndex is 0', () => {
            const state = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'ou',
                    axis: 'rows',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
            ])
            const action = moveVisUiConfigLayoutDimension({
                identifier: { id: 'dx' },
                sourceAxis: 'columns',
                targetAxis: 'rows',
                targetIndex: 0,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.rows.map((d) => d.id)).toEqual([
                'dx',
                'ou',
                'pe',
            ])
        })

        it('moves into the middle before the target index', () => {
            const state = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'ou',
                    axis: 'rows',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
            ])
            const action = moveVisUiConfigLayoutDimension({
                identifier: { id: 'dx' },
                sourceAxis: 'columns',
                targetAxis: 'rows',
                targetIndex: 1,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.rows.map((d) => d.id)).toEqual([
                'ou',
                'dx',
                'pe',
            ])
        })

        it('moves into the middle after the target index when insertAfter is true', () => {
            const state = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'ou',
                    axis: 'rows',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
            ])
            const action = moveVisUiConfigLayoutDimension({
                identifier: { id: 'dx' },
                sourceAxis: 'columns',
                targetAxis: 'rows',
                targetIndex: 0,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.rows.map((d) => d.id)).toEqual([
                'ou',
                'dx',
                'pe',
            ])
        })
    })

    describe('moving within the same axis', () => {
        const buildState = () =>
            createStateWithDimensions([
                { id: 'c1', axis: 'columns', items: [] },
                { id: 'c2', axis: 'columns', items: [] },
                { id: 'c3', axis: 'columns', items: [] },
                { id: 'c4', axis: 'columns', items: [] },
                { id: 'c5', axis: 'columns', items: [] },
                { id: 'c6', axis: 'columns', items: [] },
            ])

        it('moves from start to end when no targetIndex is provided', () => {
            const state = buildState()
            const action = moveVisUiConfigLayoutDimension({
                identifier: { id: 'c1' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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
                identifier: { id: 'c6' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 0,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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
                identifier: { id: 'c2' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 3,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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
                identifier: { id: 'c2' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 3,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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
                identifier: { id: 'c4' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 1,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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
                identifier: { id: 'c4' },
                sourceAxis: 'columns',
                targetAxis: 'columns',
                targetIndex: 1,
                insertAfter: true,
            })
            const result = visUiConfigSlice.reducer(state, action)
            expect(result.layout.columns.map((d) => d.id)).toEqual([
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

describe('removeVisUiConfigLayoutDimension', () => {
    it('removes the dimension when it exists', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
            {
                id: 'pe',
                axis: 'columns',
                items: [],
            },
            {
                id: 'ou',
                axis: 'columns',
                items: [],
            },
        ])
        const action = removeVisUiConfigLayoutDimension({
            identifier: { id: 'pe' },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns.map((d) => d.id)).toEqual(['dx', 'ou'])
    })

    it('throws when trying to remove a missing dimension', () => {
        const state = createStateWithDimensions([
            {
                id: 'dx',
                axis: 'columns',
                items: [],
            },
        ])
        const action = removeVisUiConfigLayoutDimension({
            identifier: { id: 'nonexistent' },
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension not found'
        )
    })

    it('matches dimension with full context (programId, programStageId)', () => {
        const state = createStateWithDimensions([
            {
                id: 'dataElement1',
                programId: 'prog1',
                programStageId: 'stage1',
                axis: 'columns',
                items: [],
            },
            {
                id: 'dataElement1',
                programId: 'prog2',
                programStageId: 'stage2',
                axis: 'columns',
                items: [],
            },
        ])
        const action = removeVisUiConfigLayoutDimension({
            identifier: {
                id: 'dataElement1',
                programId: 'prog2',
                programStageId: 'stage2',
            },
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toHaveLength(1)
        expect(result.layout.columns[0].programId).toBe('prog1')
    })
})

describe('selectors', () => {
    describe('getVisUiConfigLayout', () => {
        it('returns the entire layout', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
            ])
            const result = getVisUiConfigLayout(
                wrapStateForSelectors(sliceState)
            )
            expect(result.columns).toHaveLength(1)
            expect(result.rows).toHaveLength(1)
            expect(result.filters).toHaveLength(0)
            expect(result.columns[0].id).toBe('dx')
            expect(result.rows[0].id).toBe('pe')
        })
    })

    describe('getVisUiConfigAllLayoutDimensions', () => {
        it('returns all layout dimensions as flat array', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
            ])
            const result = getVisUiConfigAllLayoutDimensions(
                wrapStateForSelectors(sliceState)
            )
            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('dx')
            expect(result[1].id).toBe('pe')
        })
    })

    describe('getVisUiConfigLayoutDimensionsForAxis', () => {
        it('returns only dimensions for the specified axis', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'pe',
                    axis: 'rows',
                    items: [],
                },
                {
                    id: 'ou',
                    axis: 'columns',
                    items: [],
                },
            ])
            const result = getVisUiConfigLayoutDimensionsForAxis(
                wrapStateForSelectors(sliceState),
                'columns'
            )
            expect(result).toHaveLength(2)
            expect(result.map((d) => d.id)).toEqual(['dx', 'ou'])
        })
    })

    describe('getVisUiConfigLayoutDimension', () => {
        it('returns the dimension matching the identifier', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: ['item1'],
                },
            ])
            const result = getVisUiConfigLayoutDimension(
                wrapStateForSelectors(sliceState),
                { id: 'dx' }
            )
            expect(result).toMatchObject({
                id: 'dx',
                items: ['item1'],
            })
        })

        it('returns undefined when dimension is not found', () => {
            const sliceState = createStateWithDimensions([])
            const result = getVisUiConfigLayoutDimension(
                wrapStateForSelectors(sliceState),
                {
                    id: 'nonexistent',
                }
            )
            expect(result).toBeUndefined()
        })

        it('matches dimension with context fields', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dataElement1',
                    programId: 'prog1',
                    programStageId: 'stage1',
                    axis: 'columns',
                    items: [],
                },
                {
                    id: 'dataElement1',
                    programId: 'prog2',
                    programStageId: 'stage2',
                    axis: 'columns',
                    items: [],
                },
            ])
            const result = getVisUiConfigLayoutDimension(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dataElement1',
                    programId: 'prog2',
                    programStageId: 'stage2',
                }
            )
            expect(result?.programId).toBe('prog2')
        })
    })

    describe('getVisUiConfigLayoutDimensionItems', () => {
        it('returns items for the dimension', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: ['item1', 'item2'],
                },
            ])
            const result = getVisUiConfigLayoutDimensionItems(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dx',
                }
            )
            expect(result).toEqual(['item1', 'item2'])
        })

        it('returns empty array when dimension is not found', () => {
            const sliceState = createStateWithDimensions([])
            const result = getVisUiConfigLayoutDimensionItems(
                wrapStateForSelectors(sliceState),
                {
                    id: 'nonexistent',
                }
            )
            expect(result).toEqual([])
        })
    })

    describe('getVisUiConfigLayoutDimensionConditions', () => {
        it('returns conditions for the dimension', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                    conditions: {
                        condition: 'GT:5',
                        legendSet: 'legend1',
                    },
                },
            ])
            const result = getVisUiConfigLayoutDimensionConditions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dx',
                }
            )
            expect(result).toEqual({
                condition: 'GT:5',
                legendSet: 'legend1',
            })
        })

        it('returns empty conditions object when dimension is not found', () => {
            const sliceState = createStateWithDimensions([])
            const result = getVisUiConfigLayoutDimensionConditions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'nonexistent',
                }
            )
            expect(result).toEqual({
                condition: undefined,
                legendSet: undefined,
            })
        })

        it('returns empty conditions object when dimension has no conditions', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
            ])
            const result = getVisUiConfigLayoutDimensionConditions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dx',
                }
            )
            expect(result).toEqual({
                condition: undefined,
                legendSet: undefined,
            })
        })
    })

    describe('getVisUiConfigLayoutDimensionRepetitions', () => {
        it('returns repetitions for the dimension', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                    repetitions: {
                        mostRecent: 3,
                        oldest: 2,
                    },
                },
            ])
            const result = getVisUiConfigLayoutDimensionRepetitions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dx',
                }
            )
            expect(result).toEqual({
                mostRecent: 3,
                oldest: 2,
            })
        })

        it('returns default repetitions when dimension is not found', () => {
            const sliceState = createStateWithDimensions([])
            const result = getVisUiConfigLayoutDimensionRepetitions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'nonexistent',
                }
            )
            expect(result).toEqual({
                mostRecent: 1,
                oldest: 0,
            })
        })

        it('returns default repetitions when dimension has no repetitions', () => {
            const sliceState = createStateWithDimensions([
                {
                    id: 'dx',
                    axis: 'columns',
                    items: [],
                },
            ])
            const result = getVisUiConfigLayoutDimensionRepetitions(
                wrapStateForSelectors(sliceState),
                {
                    id: 'dx',
                }
            )
            expect(result).toEqual({
                mostRecent: 1,
                oldest: 0,
            })
        })
    })
})
