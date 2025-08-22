import {
    ACCESSORY_PANEL_DEFAULT_WIDTH,
    ACCESSORY_PANEL_MIN_PX_AT_END,
    ACCESSORY_PANEL_MIN_WIDTH,
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
