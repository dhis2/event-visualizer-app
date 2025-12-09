import { describe, it, expect } from 'vitest'
import { visUiConfigSlice, initialState } from '../vis-ui-config-slice'

const {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
    deleteVisUiConfigLayoutDimension,
} = visUiConfigSlice.actions

describe('addVisUiConfigLayoutDimension', () => {
    it('should add dimension to the end if insertIndex is undefined', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a2'], filters: [], rows: [] },
        }
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a3',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })

    it('should insert at specific index', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a3', 'a4'], filters: [], rows: [] },
        }
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a2',
            insertIndex: 1,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3', 'a4'])
    })

    it('should insert at index 0', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a2', 'a3'], filters: [], rows: [] },
        }
        const action = addVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a1',
            insertIndex: 0,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'a3'])
    })
})

describe('moveVisUiConfigLayoutDimension', () => {
    it('should move dimension from source to target axis at the end when insertIndex is not provided', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a2'], filters: ['b1', 'b2'], rows: [] },
        }
        const action = moveVisUiConfigLayoutDimension({
            dimensionId: 'b1',
            sourceAxis: 'filters',
            targetAxis: 'columns',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a2', 'b1'])
        expect(result.layout.filters).toEqual(['b2'])
    })

    it('should move dimension from source to target axis at specific index', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a3'], filters: ['b1', 'b2'], rows: [] },
        }
        const action = moveVisUiConfigLayoutDimension({
            dimensionId: 'b1',
            sourceAxis: 'filters',
            targetAxis: 'columns',
            insertIndex: 1,
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'b1', 'a3'])
        expect(result.layout.filters).toEqual(['b2'])
    })

    it('should throw error if dimension not found in source axis', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1'], filters: ['b1'], rows: [] },
        }
        const action = moveVisUiConfigLayoutDimension({
            dimensionId: 'b2',
            sourceAxis: 'filters',
            targetAxis: 'columns',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension b2 not found in source axis filters'
        )
    })
})

describe('deleteVisUiConfigLayoutDimension', () => {
    it('should remove dimension from axis', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a2', 'a3'], filters: [], rows: [] },
        }
        const action = deleteVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a2',
        })
        const result = visUiConfigSlice.reducer(state, action)
        expect(result.layout.columns).toEqual(['a1', 'a3'])
    })

    it('should throw error if dimension not found in axis', () => {
        const state = {
            ...initialState,
            layout: { columns: ['a1', 'a2'], filters: [], rows: [] },
        }
        const action = deleteVisUiConfigLayoutDimension({
            axis: 'columns',
            dimensionId: 'a3',
        })
        expect(() => visUiConfigSlice.reducer(state, action)).toThrow(
            'Dimension a3 not found in axis columns'
        )
    })
})
