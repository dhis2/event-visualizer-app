import {
    readLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import { SIDEBAR_STORAGE_KEY } from './constants'

export const getSidebarWidthFromLocalStorage = (): number | undefined => {
    const width = Number.parseInt(readLocalStorage(SIDEBAR_STORAGE_KEY) ?? '')

    return Number.isFinite(width) ? width : undefined
}

export const setSidebarWidthToLocalStorage = (width: number): void => {
    writeLocalStorage(SIDEBAR_STORAGE_KEY, String(Math.round(width)))
}
