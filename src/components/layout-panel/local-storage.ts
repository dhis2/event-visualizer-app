import type { LayoutPanelHeight } from '@store/ui-slice'
import { AXES_HEIGHT_STORAGE_KEY } from './constants'

export const getLayoutPanelHeightFromLocalStorage = (): LayoutPanelHeight => {
    const stored = globalThis.localStorage.getItem(AXES_HEIGHT_STORAGE_KEY)

    if (stored === null) {
        return 'AUTO_FIT'
    }

    const parsed = Number.parseInt(stored)

    return Number.isFinite(parsed) ? parsed : 'AUTO_FIT'
}

export const setLayoutPanelHeightToLocalStorage = (
    height: LayoutPanelHeight
): void => {
    try {
        if (height === 'AUTO_FIT') {
            globalThis.localStorage.removeItem(AXES_HEIGHT_STORAGE_KEY)
        } else {
            globalThis.localStorage.setItem(
                AXES_HEIGHT_STORAGE_KEY,
                String(Math.round(height))
            )
        }
    } catch {
        // ignore
    }
}
