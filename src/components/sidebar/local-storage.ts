import { SIDEBAR_STORAGE_KEY } from './constants'

/* Undefined when nothing usable is stored, so the caller applies its own
 * default. The value is returned unclamped: the viewport it has to fit is the
 * caller's concern, not the storage layer's. */
export const getSidebarWidthFromLocalStorage = (): number | undefined => {
    try {
        const width = Number.parseInt(
            globalThis.localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? ''
        )

        return Number.isFinite(width) ? width : undefined
    } catch {
        return undefined
    }
}

export const setSidebarWidthToLocalStorage = (width: number): void => {
    try {
        globalThis.localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(Math.round(width))
        )
    } catch {
        // ignore
    }
}
