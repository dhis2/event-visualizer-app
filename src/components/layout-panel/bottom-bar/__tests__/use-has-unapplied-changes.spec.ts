import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    addVisUiConfigLayoutDimension,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
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

const renderHookWithVis = (
    currentVis: Partial<RootState>['currentVis'],
    visUiConfig?: Partial<RootState>['visUiConfig']
) =>
    renderHookWithAppWrapper(useHasUnappliedChanges, {
        metadata,
        partialStore: {
            preloadedState: {
                currentVis,
                ...(visUiConfig && { visUiConfig }),
            },
        },
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

    /* An empty layout makes every output type inapplicable, so there is no
     * button to hint at — and the builder could not produce a
     * TRACKED_ENTITY_INSTANCE visualization from it either. */
    it('is false when no output type is applicable', async () => {
        const { result } = await renderHookWithVis(
            { ...populatedVis, outputType: 'TRACKED_ENTITY_INSTANCE' },
            {
                ...visUiConfigInitialState,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            }
        )

        expect(result.current).toBe(false)
    })

    /* The layout holds an event program dimension, so EVENT is applicable and
     * TRACKED_ENTITY_INSTANCE is not. Applying requires switching output type,
     * which means what is on screen cannot be what the config describes — and
     * the comparison could not run for the selected type anyway. */
    it('is true when the selected output type is inapplicable but another one is', async () => {
        const { result } = await renderHookWithVis(populatedVis, {
            ...visUiConfigInitialState,
            outputType: 'TRACKED_ENTITY_INSTANCE',
            layout: { columns: [DIMENSION_ID], rows: [], filters: [] },
        })

        expect(result.current).toBe(true)
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
