import {
    AXES_HEIGHT_STORAGE_KEY,
    LAYOUT_PANEL_HEIGHT_AUTO_FIT,
    type LayoutPanelHeight,
} from './constants'

export const getLayoutPanelHeightFromLocalStorage = (): LayoutPanelHeight => {
    const stored = globalThis.localStorage.getItem(AXES_HEIGHT_STORAGE_KEY)

    if (stored === null) {
        return LAYOUT_PANEL_HEIGHT_AUTO_FIT
    }

    const parsed = Number.parseInt(stored)

    return Number.isFinite(parsed) ? parsed : LAYOUT_PANEL_HEIGHT_AUTO_FIT
}

export const setLayoutPanelHeightToLocalStorage = (
    height: LayoutPanelHeight
): void => {
    try {
        if (height === LAYOUT_PANEL_HEIGHT_AUTO_FIT) {
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
