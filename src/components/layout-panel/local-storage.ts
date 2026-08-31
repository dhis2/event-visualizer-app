import {
    readLocalStorage,
    removeLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import type { LayoutPanelHeight } from '@store/ui-slice'

export const AXES_HEIGHT_STORAGE_KEY = 'dhis2.event-visualizer.axesHeight'

/* An absent key means the panel fits its content, which is what 'AUTO_FIT'
 * denotes — so it is the stored state, not a fallback the caller supplies. */
export const getLayoutPanelHeightFromLocalStorage = (): LayoutPanelHeight => {
    const height = Number.parseInt(
        readLocalStorage(AXES_HEIGHT_STORAGE_KEY) ?? ''
    )

    return Number.isFinite(height) ? height : 'AUTO_FIT'
}

export const setLayoutPanelHeightToLocalStorage = (
    height: LayoutPanelHeight
): void => {
    if (height === 'AUTO_FIT') {
        removeLocalStorage(AXES_HEIGHT_STORAGE_KEY)
    } else {
        writeLocalStorage(AXES_HEIGHT_STORAGE_KEY, String(Math.round(height)))
    }
}
