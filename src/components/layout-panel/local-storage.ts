import type { LayoutPanelHeight } from '@store/ui-slice'

const AXES_HEIGHT_STORAGE_KEY = 'dhis2.event-visualizer.axesHeight'

/* Undefined when no user-set height is stored, so the caller applies its own
 * default. */
export const getLayoutPanelHeightFromLocalStorage = (): number | undefined => {
    try {
        const stored = globalThis.localStorage.getItem(AXES_HEIGHT_STORAGE_KEY)

        if (stored === null) {
            return undefined
        }

        const height = Number.parseInt(stored)

        return Number.isFinite(height) ? height : undefined
    } catch {
        return undefined
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
