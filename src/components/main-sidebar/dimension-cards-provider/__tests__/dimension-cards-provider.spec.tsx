import { renderHook } from '@testing-library/react'
import type { FC, PropsWithChildren } from 'react'
import { describe, it, expect } from 'vitest'
import { DimensionCardsContext } from '../dimension-cards-context'
import type { DimensionCardsContextValue } from '../dimension-cards-context'
import { useIsDimensionSelected } from '../use-is-dimension-selected'
import { useSelectedDimensionCount } from '../use-selected-dimension-count'
import type { DimensionMetadataItem, DimensionType } from '@types'

// Helper to build a minimal DimensionMetadataItem
const dim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: 'dimA',
    dimensionId: 'dimA',
    name: 'Dimension A',
    dimensionType: 'DATA_ELEMENT' as DimensionType,
    ...overrides,
})

// Helper to create a wrapper that provides a custom DimensionCardsContext value
const createContextWrapper = (
    value: DimensionCardsContextValue
): FC<PropsWithChildren> => {
    const ContextWrapper: FC<PropsWithChildren> = ({ children }) => (
        <DimensionCardsContext.Provider value={value}>
            {children}
        </DimensionCardsContext.Provider>
    )
    return ContextWrapper
}

const dimA = dim({ id: 'dimA', dimensionId: 'dimA' })
const dimB = dim({ id: 'dimB', dimensionId: 'dimB', dimensionType: 'PERIOD' })

// ===== useIsDimensionSelected =====

describe('useIsDimensionSelected', () => {
    it('returns false when selectedIds is empty (context default)', () => {
        const { result } = renderHook(() => useIsDimensionSelected('dimA'))
        expect(result.current).toBe(false)
    })

    it('returns false when dimensionId is undefined', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimA']),
            selectedDimensions: [dimA],
        })
        const { result } = renderHook(() => useIsDimensionSelected(undefined), {
            wrapper,
        })
        expect(result.current).toBe(false)
    })

    it('returns true when the dimension ID is in selectedIds', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimA', 'dimB']),
            selectedDimensions: [dimA, dimB],
        })
        const { result } = renderHook(() => useIsDimensionSelected('dimA'), {
            wrapper,
        })
        expect(result.current).toBe(true)
    })

    it('returns false when the dimension ID is not in selectedIds', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimB']),
            selectedDimensions: [dimB],
        })
        const { result } = renderHook(() => useIsDimensionSelected('dimA'), {
            wrapper,
        })
        expect(result.current).toBe(false)
    })
})

// ===== useSelectedDimensionCount =====

describe('useSelectedDimensionCount', () => {
    it('returns 0 when selectedDimensions is empty (context default)', () => {
        const { result } = renderHook(() =>
            useSelectedDimensionCount(() => true)
        )
        expect(result.current).toBe(0)
    })

    it('returns the count of dimensions matching the predicate', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimA', 'dimB']),
            selectedDimensions: [dimA, dimB],
        })
        const { result } = renderHook(
            () =>
                useSelectedDimensionCount(
                    (d) => d.dimensionType === 'DATA_ELEMENT'
                ),
            { wrapper }
        )
        expect(result.current).toBe(1)
    })

    it('returns 0 when no dimensions match the predicate', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimA']),
            selectedDimensions: [dimA],
        })
        const { result } = renderHook(
            () =>
                useSelectedDimensionCount(
                    (d) => d.dimensionType === 'PROGRAM_INDICATOR'
                ),
            { wrapper }
        )
        expect(result.current).toBe(0)
    })

    it('counts all dimensions when predicate always returns true', () => {
        const wrapper = createContextWrapper({
            selectedIds: new Set(['dimA', 'dimB']),
            selectedDimensions: [dimA, dimB],
        })
        const { result } = renderHook(
            () => useSelectedDimensionCount(() => true),
            { wrapper }
        )
        expect(result.current).toBe(2)
    })
})
