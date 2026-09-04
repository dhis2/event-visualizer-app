import { isDebugMode } from '@modules/debug-mode'
import { logger } from '@modules/logger'

/* localStorage throws when the browser blocks site data for the origin. These
 * reads run during app startup, so an unguarded throw would stop the app from
 * loading rather than just losing the stored preference. */

const logFailure = (action: string, key: string, error: unknown): void => {
    if (isDebugMode()) {
        logger.error(`Could not ${action} "${key}" in localStorage`, error)
    }
}

export const readLocalStorage = (key: string): string | null => {
    try {
        return globalThis.localStorage.getItem(key)
    } catch (error) {
        logFailure('read', key, error)
        return null
    }
}

export const writeLocalStorage = (key: string, value: string): void => {
    try {
        globalThis.localStorage.setItem(key, value)
    } catch (error) {
        logFailure('write', key, error)
    }
}

export const removeLocalStorage = (key: string): void => {
    try {
        globalThis.localStorage.removeItem(key)
    } catch (error) {
        logFailure('remove', key, error)
    }
}
