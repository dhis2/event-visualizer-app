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
            onClick={() => addMetadata({ uid: 'a', name: 'Static Name' })}
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
            onClick={() => addMetadata({ uid: 'b', name: 'Store Name' })}
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
            result.current({ uid: 'a', name: 'First Name' })
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
            result.current({ uid: 'a', name: 'Same Name' })
        })
        const prevRenders = { ...renders }
        act(() => {
            result.current({ uid: 'a', name: 'Same Name' })
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
            result.current({ uid: 'b', name: 'Other Name' })
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
            result.current({ uid: 'a', name: 'Name1' })
        })
        act(() => {
            result.current({ uid: 'b', name: 'Name2' })
        })
        expect(renders.add).toBe(1)
        expect(renders.store).toBe(1)
    })

    it('useMetadataItems rerenders only for relevant keys', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        act(() => {
            result.current({ uid: 'b', name: 'NameB' })
        })
        expect(renders.items).toBe(2)
        act(() => {
            result.current({ uid: 'a', name: 'NameA' })
        })
        expect(renders.items).toBe(3)
        act(() => {
            result.current({ uid: 'b', name: 'NameB' })
        })
        expect(renders.items).toBe(3)
    })

    it('addMetadata supports all input forms', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: ProviderWithComponents,
        })
        // Single object
        act(() => {
            result.current.addMetadata({ uid: 'x', name: 'X' })
        })
        expect(result.current.getMetadataItem('x')).toEqual({
            id: 'x',
            name: 'X',
            options: [],
            style: {},
        })
        // Array
        act(() => {
            result.current.addMetadata([
                { uid: 'y', name: 'Y' },
                { uid: 'z', name: 'Z' },
            ])
        })
        expect(result.current.getMetadataItems(['y', 'z'])).toEqual([
            {
                id: 'y',
                name: 'Y',
                options: [],
                style: {},
            },
            {
                id: 'z',
                name: 'Z',
                options: [],
                style: {},
            },
        ])
        // Record
        act(() => {
            result.current.addMetadata({
                a: { uid: 'a', name: 'A' },
                b: { uid: 'b', name: 'B' },
            })
        })
        expect(result.current.getMetadataItems(['a', 'b'])).toEqual([
            {
                id: 'a',
                name: 'A',
                options: [],
                style: {},
            },
            {
                id: 'b',
                name: 'B',
                options: [],
                style: {},
            },
        ])
    })
})
