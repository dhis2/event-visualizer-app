/* localStorage throws when the browser blocks site data for the origin. These
 * reads run during app startup, so an unguarded throw would stop the app from
 * loading rather than just losing the stored preference. */

export const readLocalStorage = (key: string): string | null => {
    try {
        return globalThis.localStorage.getItem(key)
    } catch {
        return null
    }
}

export const writeLocalStorage = (key: string, value: string): void => {
    try {
        globalThis.localStorage.setItem(key, value)
    } catch {
        // ignore
    }
}

export const removeLocalStorage = (key: string): void => {
    try {
        globalThis.localStorage.removeItem(key)
    } catch {
        // ignore
    }
}
