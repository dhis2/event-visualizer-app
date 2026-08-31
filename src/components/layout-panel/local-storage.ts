import type { LayoutPanelHeight } from '@store/ui-slice'

export const AXES_HEIGHT_STORAGE_KEY = 'dhis2.event-visualizer.axesHeight'

/* An absent key means the panel fits its content, which is what 'AUTO_FIT'
 * denotes — so it is the stored state, not a fallback the caller supplies. */
export const getLayoutPanelHeightFromLocalStorage = (): LayoutPanelHeight => {
    try {
        const stored = globalThis.localStorage.getItem(AXES_HEIGHT_STORAGE_KEY)

        if (stored === null) {
            return 'AUTO_FIT'
        }

        const height = Number.parseInt(stored)

        return Number.isFinite(height) ? height : 'AUTO_FIT'
    } catch {
        return 'AUTO_FIT'
    }
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
