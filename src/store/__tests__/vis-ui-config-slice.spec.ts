import { describe, it, expect } from 'vitest'
import { visUiConfigSlice, initialState } from '../vis-ui-config-slice'

const {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} = visUiConfigSlice.actions

const createStateWithLayout = (layout: typeof initialState.layout) => ({
    ...initialState,
    layout,
})

describe('addVisUiConfigLayoutDimension', () => {
    it('adds to an empty axis', () => {
        const state = createStateWithLayout({
            columns: [],
            filters: [],
            rows: [],
        })
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a1',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1'])
    })

    it('appends to a populated axis when insertIndex is omitted', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2'],
            filters: [],
            rows: [],
        })
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a3',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })

    it('inserts before the provided index', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a3', 'a4'],
            filters: [],
            rows: [],
        })
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a2',
            insertIndex: 1,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })

    it('inserts after the provided index when insertAfter is true', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2', 'a4'],
            filters: [],
            rows: [],
        })
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a3',
            insertIndex: 1,
            insertAfter: true,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
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

describe('removeVisUiConfigLayoutDimension', () => {
    it('removes the dimension when it exists', () => {
        const state = createStateWithLayout({
            columns: ['a1', 'a2', 'a3'],
            filters: [],
            rows: [],
        })
        const action = removeVisUiConfigLayoutDimension({
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
        const action = removeVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a3',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension a3 not found in axis columns'
        )
    })
})
