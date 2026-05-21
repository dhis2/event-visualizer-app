import {
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_MAX_OFFSET,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_STORAGE_KEY,
} from './constants'

export const getSidebarWidthFromLocalStorage = (): number => {
    const stored = globalThis.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    const width =
        stored === null ? SIDEBAR_DEFAULT_WIDTH : Number.parseInt(stored)
    const maxWidth = globalThis.innerWidth - SIDEBAR_MAX_OFFSET

    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(width, maxWidth))
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
