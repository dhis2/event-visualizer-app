import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ButtonAction } from '../base-button'
import type { UpdateSyncIconHandle } from '../update-sync-icon'
import { useActionSpin } from '../use-action-spin'

type Result = ReturnType<typeof useActionSpin>

const renderActionSpin = (initialAction: ButtonAction) =>
    renderHook<Result, ButtonAction>((action) => useActionSpin(action), {
        initialProps: initialAction,
    })

const attachIconSpy = (result: { current: Result }) => {
    const play = vi.fn()
    const ref = result.current.syncIconRef as {
        current: UpdateSyncIconHandle | null
    }
    ref.current = { play }
    return play
}

describe('useActionSpin', () => {
    it('spins immediately when triggered while already on the update action', () => {
        const { result } = renderActionSpin('update')
        const play = attachIconSpy(result)

        act(() => result.current.triggerSpin())

        expect(play).toHaveBeenCalledTimes(1)
    })

    it('defers the spin until the button switches to the update action', () => {
        const { result, rerender } = renderActionSpin('switch')
        const play = attachIconSpy(result)

        act(() => result.current.triggerSpin())
        expect(play).not.toHaveBeenCalled()

        rerender('update')
        expect(play).toHaveBeenCalledTimes(1)
    })

    it('does not spin when the action becomes update without a trigger', () => {
        const { result, rerender } = renderActionSpin('switch')
        const play = attachIconSpy(result)

        rerender('update')

        expect(play).not.toHaveBeenCalled()
    })
})
