/* Every access is guarded because localStorage throws when the browser blocks
 * site data for the origin. A forgotten preference beats a broken app. */

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
