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

    it('should prevent overwriting initial metadata items', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        // Get the original value
        const originalItem = result.current.getMetadataItem('TODAY')
        expect(originalItem?.name).toBe('Today')

        // Try to overwrite with different data
        act(() => {
            result.current.addMetadata({
                uid: 'TODAY',
                name: 'Modified Today',
                code: 'NEW_CODE',
                description: 'This should not overwrite the initial metadata',
            })
        })

        // Verify the original value is preserved
        const afterAttemptItem = result.current.getMetadataItem('TODAY')
        expect(afterAttemptItem).toEqual(originalItem)
        expect(afterAttemptItem?.name).toBe('Today') // Should still be the original value
        expect(afterAttemptItem).not.toHaveProperty('code') // Should not have the new properties
    })

    it('should prevent overwriting initial metadata with different input formats', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        const originalUserOrgUnit =
            result.current.getMetadataItem('USER_ORGUNIT')

        // Try to overwrite with array format
        act(() => {
            result.current.addMetadata([
                { uid: 'USER_ORGUNIT', name: 'Modified User Org Unit' },
            ])
        })

        // Try to overwrite with record format
        act(() => {
            result.current.addMetadata({
                USER_ORGUNIT: {
                    uid: 'USER_ORGUNIT',
                    name: 'Another Modified Name',
                },
            })
        })

        // Verify original is preserved
        const finalItem = result.current.getMetadataItem('USER_ORGUNIT')
        expect(finalItem).toEqual(originalUserOrgUnit)
        expect(finalItem?.name).toBe('User organisation unit')
    })

    it('should allow adding new metadata that does not conflict with initial metadata', () => {
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
            options: [],
            style: {},
        })

        // Verify initial metadata is still intact
        const todayItem = result.current.getMetadataItem('TODAY')
        expect(todayItem?.name).toBe('Today')
    })

    it('should not trigger re-renders when attempting to overwrite initial metadata', () => {
        let renderCount = 0

        function TestComponent() {
            renderCount++
            const todayItem = useMetadataItem('TODAY')
            const addMetadata = useAddMetadata()

            return (
                <button
                    onClick={() =>
                        addMetadata({ uid: 'TODAY', name: 'Should Not Update' })
                    }
                >
                    {todayItem?.name}
                </button>
            )
        }

        const { getByRole } = render(
            <MetadataProvider>
                <TestComponent />
            </MetadataProvider>
        )

        expect(renderCount).toBe(1) // Initial render

        // Click button to attempt overwrite
        act(() => {
            getByRole('button').click()
        })

        // Should not cause re-render since no actual change occurred
        expect(renderCount).toBe(1)
    })

    it('should handle bulk operations correctly with initial metadata', () => {
        const { result } = renderHook(() => useMetadataStore(), {
            wrapper: MetadataProvider,
        })

        const originalToday = result.current.getMetadataItem('TODAY')
        const originalLastWeek = result.current.getMetadataItem('LAST_WEEK')

        // Try bulk operation mixing initial metadata and new items
        act(() => {
            result.current.addMetadata([
                { uid: 'TODAY', name: 'Should Not Update' },
                { uid: 'NEW_ITEM_1', name: 'New Item 1' },
                { uid: 'LAST_WEEK', name: 'Should Not Update Either' },
                { uid: 'NEW_ITEM_2', name: 'New Item 2' },
            ])
        })

        // Initial metadata should be unchanged
        expect(result.current.getMetadataItem('TODAY')).toEqual(originalToday)
        expect(result.current.getMetadataItem('LAST_WEEK')).toEqual(
            originalLastWeek
        )

        // New items should be added
        expect(result.current.getMetadataItem('NEW_ITEM_1')).toEqual({
            id: 'NEW_ITEM_1',
            name: 'New Item 1',
            options: [],
            style: {},
        })
        expect(result.current.getMetadataItem('NEW_ITEM_2')).toEqual({
            id: 'NEW_ITEM_2',
            name: 'New Item 2',
            options: [],
            style: {},
        })
    })
})
