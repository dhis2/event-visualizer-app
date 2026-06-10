import { currentVisSlice, type CurrentVisState } from '@store/current-vis-slice'
import { setUiUpdateAnimationShowingFor, uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import type { CurrentVisualization, OutputType } from '@types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUpdateAnimation } from '../use-update-animation'

const makeCurrentVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisState => ({
    type: 'LINE_LIST',
    outputType: 'EVENT',
    columns: [],
    rows: [],
    filters: [],
    ...overrides,
})

const customValueList = makeCurrentVis({
    type: 'PIVOT_TABLE',
    value: { id: 'cv-data-element' },
})
const eventTable = makeCurrentVis({ type: 'PIVOT_TABLE' })

const renderUpdateAnimation = (
    buttonType: OutputType,
    isCustomValueButton?: boolean,
    currentVis: CurrentVisState = {}
) => {
    const store = setupStore(
        {
            [uiSlice.name]: uiSlice.reducer,
            [currentVisSlice.name]: currentVisSlice.reducer,
        },
        { [currentVisSlice.name]: currentVis }
    )

    return renderHookWithReduxStoreProvider(
        () => useUpdateAnimation(buttonType, isCustomValueButton),
        store
    )
}

describe('useUpdateAnimation', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('is idle when no update is showing', () => {
        const { result } = renderUpdateAnimation('ENROLLMENT')

        expect(result.current.isAnimating).toBe(false)
    })

    it('animates when the stored output type matches the button', () => {
        const { result, store } = renderUpdateAnimation('ENROLLMENT')

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('ENROLLMENT'))
        })

        expect(result.current.isAnimating).toBe(true)
    })

    it('does not animate when a different output type is updating', () => {
        const { result, store } = renderUpdateAnimation('ENROLLMENT')

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
        })

        expect(result.current.isAnimating).toBe(false)
    })

    it('clears the flag once the animation duration elapses', async () => {
        const { result, store } = renderUpdateAnimation('ENROLLMENT')

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('ENROLLMENT'))
        })
        expect(result.current.isAnimating).toBe(true)

        await act(() => vi.advanceTimersByTimeAsync(500))

        expect(result.current.isAnimating).toBe(false)
        expect(store.getState().ui.updateAnimationShowingFor).toBeNull()
    })

    /* In PIVOT_TABLE mode the event-list and custom-value-list buttons both
     * carry outputType EVENT, so the stored output type alone cannot tell them
     * apart. The hook disambiguates by matching the button against the current
     * vis: the custom-value button animates only for a custom-value list, the
     * event button only for a plain event table. */
    describe('EVENT output type with both event and custom value buttons', () => {
        it('animates the event button for a plain event table', () => {
            const { result, store } = renderUpdateAnimation(
                'EVENT',
                undefined,
                eventTable
            )

            act(() => {
                store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
            })

            expect(result.current.isAnimating).toBe(true)
        })

        it('does not animate the event button for a custom value list', () => {
            const { result, store } = renderUpdateAnimation(
                'EVENT',
                undefined,
                customValueList
            )

            act(() => {
                store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
            })

            expect(result.current.isAnimating).toBe(false)
        })

        it('animates the custom value button for a custom value list', () => {
            const { result, store } = renderUpdateAnimation(
                'EVENT',
                true,
                customValueList
            )

            act(() => {
                store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
            })

            expect(result.current.isAnimating).toBe(true)
        })

        it('does not animate the custom value button for a plain event table', () => {
            const { result, store } = renderUpdateAnimation(
                'EVENT',
                true,
                eventTable
            )

            act(() => {
                store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
            })

            expect(result.current.isAnimating).toBe(false)
        })
    })
})
