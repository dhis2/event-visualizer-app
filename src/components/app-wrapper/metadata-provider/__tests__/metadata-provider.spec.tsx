import { render, act, renderHook } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { expect, describe, it, beforeEach } from 'vitest'
import {
    MetadataProvider,
    useMetadataItem,
    useMetadataItems,
    useAddMetadata,
    useMetadataStore,
    useDimensionMetadata,
    useDimensionsMetadata,
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

describe('useDimensionMetadata', () => {
    it('resolves ambiguous ID when program stage metadata is added', () => {
        const { result } = renderHook(
            () => ({
                dimensionMetadata: useDimensionMetadata(
                    'ambiguousId.testDimension'
                ),
                addMetadata: useAddMetadata(),
            }),
            {
                wrapper: MetadataProvider,
            }
        )

        // Initially no metadata available for ambiguousId - all ID fields except dimensionId are undefined
        expect(result.current.dimensionMetadata).toEqual({
            dimensionId: 'testDimension',
            programId: undefined,
            programStageId: undefined,
            repetitionIndex: undefined,
            dimension: undefined,
            program: undefined,
            programStage: undefined,
        })

        // Add metadata for ambiguousId as a program stage
        act(() => {
            result.current.addMetadata({
                id: 'ambiguousId',
                name: 'Ambiguous Stage',
                repeatable: false,
                hideDueDate: false,
            })
        })

        // Now programStageId is populated and we have programStage metadata
        expect(result.current.dimensionMetadata).toEqual({
            dimensionId: 'testDimension',
            programId: undefined,
            programStageId: 'ambiguousId',
            repetitionIndex: undefined,
            dimension: undefined,
            program: undefined,
            programStage: {
                id: 'ambiguousId',
                name: 'Ambiguous Stage',
                repeatable: false,
                hideDueDate: false,
            },
        })
    })

    it('updates when all three metadata items are added progressively', () => {
        const { result } = renderHook(
            () => ({
                dimensionMetadata: useDimensionMetadata(
                    'testProgram.testStage[1].testDimension'
                ),
                addMetadata: useAddMetadata(),
            }),
            {
                wrapper: MetadataProvider,
            }
        )

        // Initially all undefined
        expect(result.current.dimensionMetadata.dimension).toBeUndefined()
        expect(result.current.dimensionMetadata.program).toBeUndefined()
        expect(result.current.dimensionMetadata.programStage).toBeUndefined()

        // Add dimension
        act(() => {
            result.current.addMetadata({
                id: 'testDimension',
                name: 'Test Dimension',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'INTEGER',
            })
        })

        expect(result.current.dimensionMetadata.dimension).toBeDefined()
        expect(result.current.dimensionMetadata.program).toBeUndefined()

        // Add program
        act(() => {
            result.current.addMetadata({
                id: 'testProgram',
                name: 'Test Program',
                programType: 'WITHOUT_REGISTRATION',
            })
        })

        expect(result.current.dimensionMetadata.program).toBeDefined()
        expect(result.current.dimensionMetadata.programStage).toBeUndefined()

        // Add stage
        act(() => {
            result.current.addMetadata({
                id: 'testStage',
                name: 'Test Stage',
                repeatable: false,
                hideDueDate: true,
            })
        })

        // All metadata now populated
        expect(result.current.dimensionMetadata).toEqual({
            dimensionId: 'testDimension',
            programId: 'testProgram',
            programStageId: 'testStage',
            repetitionIndex: '1',
            dimension: {
                id: 'testDimension',
                name: 'Test Dimension',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'INTEGER',
            },
            program: {
                id: 'testProgram',
                name: 'Test Program',
                programType: 'WITHOUT_REGISTRATION',
            },
            programStage: {
                id: 'testStage',
                name: 'Test Stage',
                repeatable: false,
                hideDueDate: true,
            },
        })
    })
})

describe('useDimensionsMetadata', () => {
    it('returns empty record for empty array', () => {
        const { result } = renderHook(
            () => ({
                dimensionsMetadata: useDimensionsMetadata([]),
            }),
            {
                wrapper: MetadataProvider,
            }
        )

        expect(result.current.dimensionsMetadata).toEqual({})
    })

    it('returns metadata for multiple dimension ID inputs', () => {
        const { result } = renderHook(
            () => ({
                dimensionsMetadata: useDimensionsMetadata([
                    'dimension1',
                    'program.dimension2',
                    'program.stage[1].dimension3',
                ]),
                addMetadata: useAddMetadata(),
            }),
            {
                wrapper: MetadataProvider,
            }
        )

        // Initially all undefined
        expect(result.current.dimensionsMetadata).toEqual({
            dimension1: {
                dimensionId: 'dimension1',
                programId: undefined,
                programStageId: undefined,
                repetitionIndex: undefined,
                dimension: undefined,
                program: undefined,
                programStage: undefined,
            },
            'program.dimension2': {
                dimensionId: 'dimension2',
                programId: undefined,
                programStageId: undefined,
                repetitionIndex: undefined,
                dimension: undefined,
                program: undefined,
                programStage: undefined,
            },
            'program.stage[1].dimension3': {
                dimensionId: 'dimension3',
                programId: 'program',
                programStageId: 'stage',
                repetitionIndex: '1',
                dimension: undefined,
                program: undefined,
                programStage: undefined,
            },
        })

        // Add metadata for all items
        act(() => {
            result.current.addMetadata([
                {
                    id: 'dimension1',
                    name: 'Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
                {
                    id: 'dimension2',
                    name: 'Dimension 2',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'NUMBER',
                },
                {
                    id: 'dimension3',
                    name: 'Dimension 3',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'INTEGER',
                },
                {
                    id: 'program',
                    name: 'Test Program',
                    programType: 'WITH_REGISTRATION',
                },
                {
                    id: 'stage',
                    name: 'Test Stage',
                    repeatable: true,
                    hideDueDate: false,
                },
            ])
        })

        // All items now have metadata
        expect(result.current.dimensionsMetadata).toEqual({
            dimension1: {
                dimensionId: 'dimension1',
                programId: undefined,
                programStageId: undefined,
                repetitionIndex: undefined,
                dimension: {
                    id: 'dimension1',
                    name: 'Dimension 1',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                },
                program: undefined,
                programStage: undefined,
            },
            'program.dimension2': {
                dimensionId: 'dimension2',
                programId: 'program',
                programStageId: undefined,
                repetitionIndex: undefined,
                dimension: {
                    id: 'dimension2',
                    name: 'Dimension 2',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'NUMBER',
                },
                program: {
                    id: 'program',
                    name: 'Test Program',
                    programType: 'WITH_REGISTRATION',
                },
                programStage: undefined,
            },
            'program.stage[1].dimension3': {
                dimensionId: 'dimension3',
                programId: 'program',
                programStageId: 'stage',
                repetitionIndex: '1',
                dimension: {
                    id: 'dimension3',
                    name: 'Dimension 3',
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'INTEGER',
                },
                program: {
                    id: 'program',
                    name: 'Test Program',
                    programType: 'WITH_REGISTRATION',
                },
                programStage: {
                    id: 'stage',
                    name: 'Test Stage',
                    repeatable: true,
                    hideDueDate: false,
                },
            },
        })
    })

    it('updates reactively when one item changes', () => {
        const { result } = renderHook(
            () => ({
                dimensionsMetadata: useDimensionsMetadata([
                    'dimension1',
                    'dimension2',
                ]),
                addMetadata: useAddMetadata(),
            }),
            {
                wrapper: MetadataProvider,
            }
        )

        // Add first dimension
        act(() => {
            result.current.addMetadata({
                id: 'dimension1',
                name: 'Dimension 1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            })
        })

        expect(
            result.current.dimensionsMetadata.dimension1.dimension
        ).toBeDefined()
        expect(
            result.current.dimensionsMetadata.dimension2.dimension
        ).toBeUndefined()

        // Add second dimension
        act(() => {
            result.current.addMetadata({
                id: 'dimension2',
                name: 'Dimension 2',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            })
        })

        // Both now defined
        expect(
            result.current.dimensionsMetadata.dimension1.dimension
        ).toBeDefined()
        expect(
            result.current.dimensionsMetadata.dimension2.dimension
        ).toBeDefined()
    })
})
