import { bumpUiUpdateAnimation, uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ButtonAction } from '../base-button'
import type { UpdateSyncIconHandle } from '../update-sync-icon'
import { useActionSpin } from '../use-action-spin'

/* The action is held in a closure so a single store dispatch can drive one
 * re-render that sees both the new action and the bumped tick — mirroring the
 * real flow, where one update thunk changes the derived action and the tick
 * together. */
const renderActionSpin = (initialAction: ButtonAction) => {
    const store = setupStore({ ui: uiSlice.reducer })
    const actionHolder = { current: initialAction }
    const { result } = renderHookWithReduxStoreProvider(
        () => useActionSpin(actionHolder.current),
        store
    )
    const play = vi.fn()
    const ref = result.current.syncIconRef as {
        current: UpdateSyncIconHandle | null
    }
    ref.current = { play }

    const setAction = (action: ButtonAction) => {
        actionHolder.current = action
    }
    return { store, play, setAction }
}

describe('useActionSpin', () => {
    it('spins when an update happens while on the update action', () => {
        const { store, play } = renderActionSpin('update')

        act(() => {
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).toHaveBeenCalledTimes(1)
    })

    it('does not spin when the button is not the update button', () => {
        const { store, play } = renderActionSpin('switch')

        act(() => {
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).not.toHaveBeenCalled()
    })

    it('does not spin without an update (initial render / load)', () => {
        const { play } = renderActionSpin('update')

        expect(play).not.toHaveBeenCalled()
    })

    it('spins when switching to the update button', () => {
        const { store, play, setAction } = renderActionSpin('switch')

        act(() => {
            setAction('update')
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).toHaveBeenCalledTimes(1)
    })

    it('does not spin on the first create click (create -> update)', () => {
        const { store, play, setAction } = renderActionSpin('create')

        act(() => {
            setAction('update')
            store.dispatch(bumpUiUpdateAnimation())
        })

        expect(play).not.toHaveBeenCalled()
    })
})
