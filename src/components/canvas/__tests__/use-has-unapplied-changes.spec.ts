import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { addVisUiConfigLayoutDimension } from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { act } from '@testing-library/react'
import type { RootState } from '@types'
import { describe, it, expect } from 'vitest'
import {
    DIMENSION_ID,
    metadata,
    populatedVis,
} from '../__fixtures__/unapplied-changes'
import { useHasUnappliedChanges } from '../use-has-unapplied-changes'

const renderHookWithVis = (currentVis: Partial<RootState>['currentVis']) =>
    renderHookWithAppWrapper(useHasUnappliedChanges, {
        metadata,
        partialStore: { preloadedState: { currentVis } },
    })

describe('useHasUnappliedChanges', () => {
    it('is false for an empty visualization', async () => {
        const { result } = await renderHookWithVis({})

        expect(result.current).toBe(false)
    })

    it('is false for a visualization whose ui config matches it', async () => {
        const { result } = await renderHookWithVis(populatedVis)

        expect(result.current).toBe(false)
    })

    it('becomes true when a dimension is added to the layout', async () => {
        const { result, store } = await renderHookWithVis(populatedVis)

        expect(result.current).toBe(false)

        await act(async () => {
            store.dispatch(
                addVisUiConfigLayoutDimension({
                    axis: 'columns',
                    dimensionId: DIMENSION_ID,
                })
            )
        })

        expect(result.current).toBe(true)
    })

    it('becomes false again once the change is applied', async () => {
        const { result, store } = await renderHookWithVis(populatedVis)

        await act(async () => {
            store.dispatch(
                addVisUiConfigLayoutDimension({
                    axis: 'columns',
                    dimensionId: DIMENSION_ID,
                })
            )
        })

        expect(result.current).toBe(true)

        await act(async () => {
            store.dispatch(tUpdateCurrentVisFromVisUiConfig())
        })

        expect(result.current).toBe(false)
    })
})
