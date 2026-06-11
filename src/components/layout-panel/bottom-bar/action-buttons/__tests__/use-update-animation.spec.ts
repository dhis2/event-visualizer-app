import { setUiUpdateAnimationShowingFor, uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUpdateAnimation } from '../use-update-animation'

describe('useUpdateAnimation', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('is idle when no update is showing', () => {
        const store = setupStore({ ui: uiSlice.reducer })

        const { result } = renderHookWithReduxStoreProvider(
            () => useUpdateAnimation('EVENT'),
            store
        )

        expect(result.current.isAnimating).toBe(false)
    })

    it('animates when the stored output type matches the button', () => {
        const store = setupStore({ ui: uiSlice.reducer })

        const { result } = renderHookWithReduxStoreProvider(
            () => useUpdateAnimation('EVENT'),
            store
        )

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
        })

        expect(result.current.isAnimating).toBe(true)
    })

    it('does not animate when a different output type is updating', () => {
        const store = setupStore({ ui: uiSlice.reducer })

        const { result } = renderHookWithReduxStoreProvider(
            () => useUpdateAnimation('ENROLLMENT'),
            store
        )

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
        })

        expect(result.current.isAnimating).toBe(false)
    })

    it('clears the flag once the animation duration elapses', async () => {
        const store = setupStore({ ui: uiSlice.reducer })

        const { result } = renderHookWithReduxStoreProvider(
            () => useUpdateAnimation('EVENT'),
            store
        )

        act(() => {
            store.dispatch(setUiUpdateAnimationShowingFor('EVENT'))
        })
        expect(result.current.isAnimating).toBe(true)

        await act(() => vi.advanceTimersByTimeAsync(500))

        expect(result.current.isAnimating).toBe(false)
        expect(store.getState().ui.updateAnimationShowingFor).toBeNull()
    })
})
