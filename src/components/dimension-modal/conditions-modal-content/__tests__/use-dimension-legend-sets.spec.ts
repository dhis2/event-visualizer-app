import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { waitFor } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { useDimensionLegendSets } from '../use-dimension-legend-sets'

const numericDimension: DimensionMetadataItem = {
    id: 'numeric-de',
    dimensionId: 'numeric-de',
    dimensionType: 'DATA_ELEMENT',
    name: 'My numeric element',
    valueType: 'NUMBER',
}

const dimensionWithMetadataDefault: DimensionMetadataItem = {
    ...numericDimension,
    legendSetId: 'ls2',
}

const setupHook = (
    dimension: DimensionMetadataItem,
    canHaveLegendSets: boolean,
    legendSets: Array<{ id: string; name: string }>
) =>
    renderHookWithAppWrapper(
        () => useDimensionLegendSets(dimension, canHaveLegendSets),
        {
            queryData: {
                dataElements: { legendSets },
            },
        }
    )

describe('useDimensionLegendSets', () => {
    it('exposes count 0 and no default when the dimension has no legend sets', async () => {
        const { result } = await setupHook(numericDimension, true, [])

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        expect(result.current.legendSetCount).toBe(0)
        expect(result.current.defaultLegendSetId).toBeUndefined()
    })

    it('exposes count 1 and defaults to the only set', async () => {
        const { result } = await setupHook(numericDimension, true, [
            { id: 'ls1', name: 'Set 1' },
        ])

        await waitFor(() => expect(result.current.legendSetCount).toBe(1))

        expect(result.current.defaultLegendSetId).toBe('ls1')
    })

    it('exposes count 2 and defaults to the first set when the dimension has no metadata default', async () => {
        const { result } = await setupHook(numericDimension, true, [
            { id: 'ls1', name: 'Set 1' },
            { id: 'ls2', name: 'Set 2' },
        ])

        await waitFor(() => expect(result.current.legendSetCount).toBe(2))

        expect(result.current.defaultLegendSetId).toBe('ls1')
    })

    it("defaults to the dimension's metadata legendSetId when present", async () => {
        const { result } = await setupHook(dimensionWithMetadataDefault, true, [
            { id: 'ls1', name: 'Set 1' },
            { id: 'ls2', name: 'Set 2' },
        ])

        await waitFor(() => expect(result.current.legendSetCount).toBe(2))

        expect(result.current.defaultLegendSetId).toBe('ls2')
    })

    it('does not fetch when the dimension cannot have legend sets', async () => {
        const { result } = await setupHook(numericDimension, false, [
            { id: 'ls1', name: 'Set 1' },
        ])

        expect(result.current.legendSetCount).toBe(0)
        expect(result.current.defaultLegendSetId).toBeUndefined()
        expect(result.current.isLoading).toBe(false)
    })
})
