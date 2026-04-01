import {
    ACCESSORY_PANEL_DEFAULT_WIDTH,
    ACCESSORY_PANEL_MIN_PX_AT_END,
    ACCESSORY_PANEL_MIN_WIDTH,
    MAIN_SIDEBAR_DEFAULT_WIDTH,
    MAIN_SIDEBAR_MAX_OFFSET,
    MAIN_SIDEBAR_MIN_WIDTH,
    MAIN_SIDEBAR_STORAGE_KEY,
    PRIMARY_PANEL_WIDTH,
} from '@constants/panels'

export const STORAGE_KEY = 'dhis2.line-listing.accessoryPanelWidth'

const sanitizeWidth = (width: number): number => {
    const maxAvailableWidth =
        window.innerWidth -
        (PRIMARY_PANEL_WIDTH + ACCESSORY_PANEL_MIN_PX_AT_END)

    // First enforce upper bound
    if (width > maxAvailableWidth) {
        width = maxAvailableWidth
    }

    // Then enforce lower bound, so lower bound takes precedence
    if (width < ACCESSORY_PANEL_MIN_WIDTH) {
        width = ACCESSORY_PANEL_MIN_WIDTH
    }

    return width
}

export const getUserSidebarWidthFromLocalStorage = (): number => {
    const widthFromLocalStorage = window.localStorage.getItem(STORAGE_KEY)

    return sanitizeWidth(
        widthFromLocalStorage !== null
            ? parseInt(widthFromLocalStorage)
            : ACCESSORY_PANEL_DEFAULT_WIDTH
    )
}

export const setUserSidebarWidthToLocalStorage = (width: number): void =>
    window.localStorage.setItem(STORAGE_KEY, sanitizeWidth(width).toString())

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
