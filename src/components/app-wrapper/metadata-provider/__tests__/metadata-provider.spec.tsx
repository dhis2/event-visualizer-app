import { render, act, renderHook } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { expect, describe, it, beforeEach } from 'vitest'
import {
    MetadataProvider,
    useMetadataItem,
    useMetadataItems,
    useAddMetadata,
    useMetadataStore,
} from '../metadata-provider'

let renders = { item: 0, items: 0, add: 0, store: 0 }

const ItemComponent = ({ id }: { id: string }) => {
    renders.item++
    const value = useMetadataItem(id)
    return <div data-test="item">{JSON.stringify(value)}</div>
}

const ItemsComponent = ({ ids }: { ids: string[] }) => {
    renders.items++
    const values = useMetadataItems(ids)
    return <div data-test="items">{JSON.stringify(values)}</div>
}

const AddComponent = () => {
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

const StoreComponent = () => {
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

const ProviderWithComponents = ({ children }: { children?: ReactNode }) => {
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

describe('MetadataProvider rerender behavior', () => {
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
        })
        // Array
        act(() => {
            result.current.addMetadata([
                { uid: 'y', name: 'Y' },
                { uid: 'z', name: 'Z' },
            ])
        })
        expect(result.current.getMetadataItems(['y', 'z'])).toEqual({
            y: {
                id: 'y',
                name: 'Y',
            },
            z: {
                id: 'z',
                name: 'Z',
            },
        })
        // Record
        act(() => {
            result.current.addMetadata({
                a: { uid: 'a', name: 'A' },
                b: { uid: 'b', name: 'B' },
            })
        })
        expect(result.current.getMetadataItems(['a', 'b'])).toEqual({
            a: {
                id: 'a',
                name: 'A',
            },
            b: {
                id: 'b',
                name: 'B',
            },
        })
    })
})

describe('MetadataProvider initial metadata behavior', () => {
    it('should load initial metadata on provider initialization', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        // Test some known initial metadata items
        const todayItem = result.current.getMetadataItem('TODAY')
        expect(todayItem).toEqual({
            id: 'TODAY',
            name: 'Today',
        })

        const userOrgUnitItem = result.current.getMetadataItem('USER_ORGUNIT')
        expect(userOrgUnitItem).toEqual({
            id: 'USER_ORGUNIT',
            name: 'User organisation unit',
        })

        const lastWeekItem = result.current.getMetadataItem('LAST_WEEK')
        expect(lastWeekItem).toEqual({
            id: 'LAST_WEEK',
            name: 'Last week',
        })
    })

    it('should have all expected initial metadata categories', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        // Test relative period items
        const relativePeriodItems = [
            'TODAY',
            'YESTERDAY',
            'LAST_3_DAYS',
            'LAST_7_DAYS',
            'THIS_WEEK',
            'LAST_WEEK',
            'THIS_MONTH',
            'LAST_MONTH',
            'THIS_QUARTER',
            'LAST_QUARTER',
            'THIS_YEAR',
            'LAST_YEAR',
        ]

        relativePeriodItems.forEach((key) => {
            const item = result.current.getMetadataItem(key)
            expect(item).toBeDefined()
            expect((item as { id: string })?.id).toBe(key)
            expect((item as { name: string })?.name).toBeDefined()
        })

        // Test organization unit items
        const orgUnitItems = [
            'USER_ORGUNIT',
            'USER_ORGUNIT_CHILDREN',
            'USER_ORGUNIT_GRANDCHILDREN',
        ]

        orgUnitItems.forEach((key) => {
            const item = result.current.getMetadataItem(key)
            expect(item).toBeDefined()
            expect((item as { id: string })?.id).toBe(key)
            expect((item as { name: string })?.name).toBeDefined()
        })
    })

    it('should allow adding new metadata', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        // Add new metadata that doesn't conflict
        act(() => {
            result.current.addMetadata({
                uid: 'CUSTOM_ITEM',
                name: 'Custom Item',
                code: 'CUSTOM',
            })
        })

        // Verify new item was added
        const customItem = result.current.getMetadataItem('CUSTOM_ITEM')
        expect(customItem).toEqual({
            id: 'CUSTOM_ITEM',
            name: 'Custom Item',
            code: 'CUSTOM',
        })

        // Verify initial metadata is still intact
        const todayItem = result.current.getMetadataItem('TODAY')
        expect(todayItem?.name).toBe('Today')
    })

    it('should handle bulk operations correctly', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        // Try bulk operation mixing initial metadata and new items
        act(() => {
            result.current.addMetadata([
                { uid: 'NEW_ITEM_1', name: 'New Item 1' },
                { uid: 'NEW_ITEM_2', name: 'New Item 2' },
            ])
        })

        // New items should be added
        expect(result.current.getMetadataItem('NEW_ITEM_1')).toEqual({
            id: 'NEW_ITEM_1',
            name: 'New Item 1',
        })
        expect(result.current.getMetadataItem('NEW_ITEM_2')).toEqual({
            id: 'NEW_ITEM_2',
            name: 'New Item 2',
        })
    })
})

describe('MetadataProvider API and return value types', () => {
    it('useMetadataItem returns the correct value', () => {
        const { result } = renderHook(
            ({ id }) => {
                const metadataItem = useMetadataItem(id)
                const addMetadata = useAddMetadata()
                return { metadataItem, addMetadata }
            },
            {
                initialProps: { id: 'a' },
                wrapper: ProviderWithComponents,
            }
        )

        expect(result.current.metadataItem).toBeUndefined() // Initially empty

        act(() => {
            result.current.addMetadata({ uid: 'a', name: 'A' })
        })
        expect(result.current.metadataItem).toMatchInlineSnapshot(`
          {
            "id": "a",
            "name": "A",
          }
        `)
    })
    it('useMetadataItems returns a record with correct keys and values', () => {
        const { result } = renderHook(
            ({ ids }) => {
                const metadataItems = useMetadataItems(ids)
                const addMetadata = useAddMetadata()
                return { metadataItems, addMetadata }
            },
            {
                initialProps: { ids: ['a', 'b'] },
                wrapper: ProviderWithComponents,
            }
        )

        expect(result.current.metadataItems).toEqual({}) // Initially empty

        act(() => {
            result.current.addMetadata({ uid: 'a', name: 'A' })
            result.current.addMetadata({ uid: 'b', name: 'B' })
        })
        expect(result.current.metadataItems).toHaveProperty('a')
        expect(result.current.metadataItems).toHaveProperty('b')
        expect(result.current.metadataItems).toMatchInlineSnapshot(`
          {
            "a": {
              "id": "a",
              "name": "A",
            },
            "b": {
              "id": "b",
              "name": "B",
            },
          }
        `)
    })

    it('useMetadataItem returns undefined for non-existent key', () => {
        const { result } = renderHook(() => useMetadataItem('nonexistent'), {
            wrapper: ProviderWithComponents,
        })
        expect(result.current).toBeUndefined()
    })

    it('useMetadataItem handles keys that resolve during rerenders', () => {
        const item = { id: 'id-1', name: 'A name' }
        const { result } = renderHook(
            () => {
                const [key, setKey] = useState<string | null>(null)
                const metadataItem = useMetadataItem(key)
                const addMetadata = useAddMetadata()
                return { setKey, metadataItem, addMetadata }
            },
            {
                wrapper: ProviderWithComponents,
            }
        )

        expect(result.current.metadataItem).toBeUndefined()

        act(() => {
            result.current.setKey(item.id)
        })

        expect(result.current.metadataItem).toBeUndefined()

        act(() => {
            result.current.addMetadata(item)
        })

        expect(result.current.metadataItem).toEqual(item)
    })

    it('useMetadataItems returns empty object for non-existent keys', () => {
        const { result } = renderHook(() => useMetadataItems(['nonexistent']), {
            wrapper: ProviderWithComponents,
        })
        expect(result.current).toEqual({})
    })

    it('useAddMetadata is a function', () => {
        const { result } = renderHook(() => useAddMetadata(), {
            wrapper: ProviderWithComponents,
        })
        expect(typeof result.current).toBe('function')
    })

    it('useMetadataStore returns correct API shape', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: ProviderWithComponents,
        })
        expect(typeof result.current.getMetadataItem).toBe('function')
        expect(typeof result.current.getMetadataItems).toBe('function')
        expect(typeof result.current.addMetadata).toBe('function')
    })

    it('hooks return stable functions', () => {
        const { result, rerender } = renderHook(
            () => ({
                useAddMetadataResult: useAddMetadata(),
                useMetadataStoreResult: useMetadataStore(),
            }),
            {
                wrapper: ProviderWithComponents,
            }
        )

        const initialFunctions = {
            useAddMetadata: result.current.useAddMetadataResult,
            useMetadataStoreAddMetadata:
                result.current.useMetadataStoreResult.addMetadata,
            useMetadataStoreGetMetadataItem:
                result.current.useMetadataStoreResult.getMetadataItem,
            useMetadataStoreGetMetadataItems:
                result.current.useMetadataStoreResult.getMetadataItems,
        }

        act(() => {
            rerender()
        })

        expect(result.current.useAddMetadataResult).toEqual(
            initialFunctions.useAddMetadata
        )
        expect(result.current.useMetadataStoreResult.addMetadata).toEqual(
            initialFunctions.useMetadataStoreAddMetadata
        )
        expect(result.current.useMetadataStoreResult.getMetadataItem).toEqual(
            initialFunctions.useMetadataStoreGetMetadataItem
        )
        expect(result.current.useMetadataStoreResult.getMetadataItems).toEqual(
            initialFunctions.useMetadataStoreGetMetadataItems
        )
    })
})

// ---------------------------------------------------------------------------
// Alias key resolution through hooks
// ---------------------------------------------------------------------------

describe('MetadataProvider — compound-key alias resolution via hooks', () => {
    const programId = 'p1'
    const stageId = 'ps1'
    const dimId = 'weight'
    const canonicalKey = `${stageId}.${dimId}`
    const aliasKey = `${programId}.${dimId}`

    const makeProgram = () => ({
        id: programId,
        name: 'My Program',
        programType: 'WITHOUT_REGISTRATION',
        programStages: [
            {
                id: stageId,
                name: 'Stage 1',
                displayExecutionDateLabel: 'Report date',
                hideDueDate: false,
                repeatable: false,
                program: { id: programId },
            },
        ],
    })

    const makeStage = () => ({
        id: stageId,
        name: 'Stage 1',
        displayExecutionDateLabel: 'Report date',
        hideDueDate: false,
        repeatable: false,
        program: { id: programId },
    })

    const makeDimension = (name: string) => ({
        [`${canonicalKey}`]: {
            id: canonicalKey,
            name,
            dimensionType: 'DATA_ELEMENT',
        },
    })

    it('useMetadataItem resolves the item when looked up via alias key', () => {
        const { result } = renderHook(
            () => {
                const item = useMetadataItem(aliasKey)
                const store = useMetadataStore()
                return { item, store }
            },
            { wrapper: MetadataProvider }
        )

        expect(result.current.item).toBeUndefined()

        // Add context metadata (program + stage) then the dimension
        act(() => {
            result.current.store.addMetadata(makeProgram())
            result.current.store.addMetadata(makeStage())
            result.current.store.addMetadata(makeDimension('Weight'))
        })

        // Even though item is stored under canonicalKey, alias lookup should find it
        expect(result.current.item).toBeDefined()
        expect(result.current.item?.id).toBe(canonicalKey)
        expect(result.current.item?.name).toBe('Weight')
    })

    it('useMetadataItem re-renders when canonical item is updated and subscription is via alias key', () => {
        let renderCount = 0

        const { result } = renderHook(
            () => {
                renderCount++
                const item = useMetadataItem(aliasKey)
                const store = useMetadataStore()
                return { item, store }
            },
            { wrapper: MetadataProvider }
        )

        // Set up context
        act(() => {
            result.current.store.addMetadata(makeProgram())
            result.current.store.addMetadata(makeStage())
            result.current.store.addMetadata(makeDimension('Weight v1'))
        })

        const rendersAfterFirstAdd = renderCount

        // Now update the item under the canonical key
        act(() => {
            result.current.store.addMetadata(makeDimension('Weight v2'))
        })

        // Hook should have re-rendered because the subscribed alias key was notified
        expect(renderCount).toBeGreaterThan(rendersAfterFirstAdd)
        expect(result.current.item?.name).toBe('Weight v2')
    })

    it('useMetadataItem with alias key returns undefined when context metadata is missing', () => {
        const { result } = renderHook(() => useMetadataItem(aliasKey), {
            wrapper: MetadataProvider,
        })

        // Without program/stage context, alias cannot be resolved
        expect(result.current).toBeUndefined()
    })
})
