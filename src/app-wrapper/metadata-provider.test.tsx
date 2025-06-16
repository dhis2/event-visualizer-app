import { render, act, renderHook } from '@testing-library/react'
import React from 'react'
import {
    MetadataProvider,
    useMetadataItem,
    useMetadataItems,
    useAddMetadata,
    useMetadataStore,
} from './metadata-provider'

let renders = { item: 0, items: 0, add: 0, store: 0 }

function ItemComponent({ id }: { id: string }) {
    renders.item++
    const value = useMetadataItem(id)
    return <div data-test="item">{JSON.stringify(value)}</div>
}

function ItemsComponent({ ids }: { ids: string[] }) {
    renders.items++
    const values = useMetadataItems(ids)
    return <div data-test="items">{JSON.stringify(values)}</div>
}

function AddComponent() {
    renders.add++
    const addMetadata = useAddMetadata()
    return (
        <button
            data-test="add"
            onClick={() => addMetadata({ id: 'a', displayName: 'Static Name' })}
        >
            add
        </button>
    )
}

function StoreComponent() {
    renders.store++
    const { getMetadataItem, getMetadataItems, addMetadata } =
        useMetadataStore()
    return (
        <button
            data-test="store"
            onClick={() => addMetadata({ id: 'b', value: 1 })}
        >
            {JSON.stringify([
                getMetadataItem('a'),
                getMetadataItems(['a', 'b']),
            ])}
        </button>
    )
}

function ProviderWithComponents({ children }: { children?: React.ReactNode }) {
    return (
        <MetadataProvider>
            <ItemComponent id="a" />
            <ItemsComponent ids={['a', 'b']} />
            <AddComponent />
            <StoreComponent />
            {children}
        </MetadataProvider>
    )
}

describe('MetadataProvider rerender behavior (with renderHook)', () => {
    beforeEach(() => {
        renders = { item: 0, items: 0, add: 0, store: 0 }
    })

    it('initial renders', () => {
        render(<ProviderWithComponents />)
        expect(renders.item).toBe(1)
        expect(renders.items).toBe(1)
        expect(renders.add).toBe(1)
        expect(renders.store).toBe(1)
    })

    it('addMetadata rerenders only relevant hooks', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ id: 'a', displayName: 'First Name' })
        })
        expect(renders.item).toBe(2)
        expect(renders.items).toBe(2)
        expect(renders.add).toBe(1)
        expect(renders.store).toBe(1)
    })

    it('addMetadata with same id/displayName does not rerender', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ id: 'a', displayName: 'Same Name' })
        })
        const prevRenders = { ...renders }
        act(() => {
            result.current({ id: 'a', displayName: 'Same Name' })
        })
        expect(renders.item).toBe(prevRenders.item)
        expect(renders.items).toBe(prevRenders.items)
        expect(renders.add).toBe(prevRenders.add)
        expect(renders.store).toBe(prevRenders.store)
    })

    it('addMetadata for unrelated key does not rerender', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ id: 'b', displayName: 'Other Name' })
        })
        expect(renders.item).toBe(1)
        expect(renders.items).toBe(2)
        expect(renders.add).toBe(1)
        expect(renders.store).toBe(1)
    })

    it('useAddMetadata and useMetadataStore never rerender from metadata changes', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ id: 'a', displayName: 'Name1' })
        })
        act(() => {
            result.current({ id: 'b', displayName: 'Name2' })
        })
        expect(renders.add).toBe(1)
        expect(renders.store).toBe(1)
    })

    it('useMetadataItems rerenders only for relevant keys', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ id: 'b', displayName: 'NameB' })
        })
        expect(renders.items).toBe(2)
        act(() => {
            result.current({ id: 'a', displayName: 'NameA' })
        })
        expect(renders.items).toBe(3)
        act(() => {
            result.current({ id: 'b', displayName: 'NameB' })
        })
        expect(renders.items).toBe(3)
    })

    it('addMetadata supports all input forms', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: ProviderWithComponents,
        })
        // Single object
        act(() => {
            result.current.addMetadata({ id: 'x', displayName: 'X' })
        })
        expect(result.current.getMetadataItem('x')).toEqual({
            id: 'x',
            displayName: 'X',
        })
        // Array
        act(() => {
            result.current.addMetadata([
                { id: 'y', displayName: 'Y' },
                { id: 'z', displayName: 'Z' },
            ])
        })
        expect(result.current.getMetadataItems(['y', 'z'])).toEqual([
            { id: 'y', displayName: 'Y' },
            { id: 'z', displayName: 'Z' },
        ])
        // Record
        act(() => {
            result.current.addMetadata({
                a: { id: 'a', displayName: 'A' },
                b: { id: 'b', displayName: 'B' },
            })
        })
        expect(result.current.getMetadataItems(['a', 'b'])).toEqual([
            { id: 'a', displayName: 'A' },
            { id: 'b', displayName: 'B' },
        ])
    })
})
