import { useAppSelector } from '@hooks'
import { getUiUpdateAnimationTick } from '@store/ui-slice'
import { useEffect, useRef } from 'react'
import type { ButtonAction } from './base-button'
import type { UpdateSyncIconHandle } from './update-sync-icon'

/* Spins the icon whenever the visualization is updated from the UI config.
 *
 * Every update path — the layout buttons and the modals' Update buttons — goes
 * through tUpdateCurrentVisFromVisUiConfig, which bumps a tick on each run. The
 * active 'update' button is the only one whose icon is mounted, so it is the
 * only one that spins. Loading a saved visualization uses a different thunk and
 * leaves the tick untouched, so loading never spins.
 *
 * The first 'create' click is exempt: there the icon appears for the very first
 * time, and spinning it as it pops in looks off — so a create -> update
 * transition is skipped while switch -> update and repeat updates still spin. */
export const useActionSpin = (action: ButtonAction) => {
    const syncIconRef = useRef<UpdateSyncIconHandle>(null)
    const updateTick = useAppSelector(getUiUpdateAnimationTick)
    const lastTick = useRef(updateTick)
    const previousAction = useRef(action)

    useEffect(() => {
        const didUpdate = updateTick !== lastTick.current
        const wasCreating = previousAction.current === 'create'
        lastTick.current = updateTick
        previousAction.current = action
        if (didUpdate && action === 'update' && !wasCreating) {
            syncIconRef.current?.play()
        }
    }, [updateTick, action])

    return { syncIconRef }
}
