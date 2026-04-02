import {
    MAIN_SIDEBAR_DEFAULT_WIDTH,
    MAIN_SIDEBAR_MAX_OFFSET,
    MAIN_SIDEBAR_MIN_WIDTH,
    MAIN_SIDEBAR_STORAGE_KEY,
} from './constants'

export const getMainSidebarWidthFromLocalStorage = (): number => {
    const stored = globalThis.localStorage.getItem(MAIN_SIDEBAR_STORAGE_KEY)
    const width =
        stored === null ? MAIN_SIDEBAR_DEFAULT_WIDTH : Number.parseInt(stored)
    const maxWidth = globalThis.innerWidth - MAIN_SIDEBAR_MAX_OFFSET

    return Math.max(MAIN_SIDEBAR_MIN_WIDTH, Math.min(width, maxWidth))
}

export const setMainSidebarWidthToLocalStorage = (width: number): void => {
    try {
        globalThis.localStorage.setItem(
            MAIN_SIDEBAR_STORAGE_KEY,
            String(Math.round(width))
        )
    } catch {
        // ignore
    }
}
