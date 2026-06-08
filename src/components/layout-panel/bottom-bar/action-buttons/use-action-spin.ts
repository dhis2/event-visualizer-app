import { useCallback, useEffect, useRef } from 'react'
import type { ButtonAction } from './base-button'
import type { UpdateSyncIconHandle } from './update-sync-icon'

/* The icon only shows on the "update" button. So clicking a "switch" or
 * "create" button has nothing to spin yet: we spin right away if the icon is
 * already there, otherwise we wait until the button turns into "update".
 * We only spin in response to a click, not just because the button became
 * "update" on its own (for example, when loading a saved visualization). */
export const useActionSpin = (action: ButtonAction) => {
    const syncIconRef = useRef<UpdateSyncIconHandle>(null)
    const hasPendingSpin = useRef(false)
    const actionRef = useRef(action)
    actionRef.current = action

    const triggerSpin = useCallback(() => {
        if (actionRef.current === 'update') {
            syncIconRef.current?.play()
        } else {
            hasPendingSpin.current = true
        }
    }, [])

    useEffect(() => {
        if (action === 'update' && hasPendingSpin.current) {
            hasPendingSpin.current = false
            syncIconRef.current?.play()
        }
    }, [action])

    return { syncIconRef, triggerSpin }
}
