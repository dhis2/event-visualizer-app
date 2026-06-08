import { bumpUiUpdateAnimation, uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ButtonAction } from '../base-button'
import type { UpdateSyncIconHandle } from '../update-sync-icon'
import { useActionSpin } from '../use-action-spin'

const renderForAction = (action: ButtonAction) => {
    const store = setupStore({ ui: uiSlice.reducer })
    const { result } = renderHookWithReduxStoreProvider(
        () => useActionSpin(action),
        store
    )
    const play = vi.fn()
    const ref = result.current.syncIconRef as {
        current: UpdateSyncIconHandle | null
    }
    ref.current = { play }
    return { store, play }
}

describe('useActionSpin', () => {
    it('spins when the visualization updates while on the update action', () => {
        const { store, play } = renderForAction('update')

        act(() => {
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).toHaveBeenCalledTimes(1)
    })

    it('does not spin when the button is not the update button', () => {
        const { store, play } = renderForAction('switch')

        act(() => {
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).not.toHaveBeenCalled()
    })

    it('does not spin without an update (initial render / load)', () => {
        const { play } = renderForAction('update')

        expect(play).not.toHaveBeenCalled()
    })
})
