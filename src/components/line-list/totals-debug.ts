import { useEffect, useState } from 'react'

/* Prototype-only switch for trying the pagination UI with and without page
 * totals, set from the toolbar's Debug menu. Kept in localStorage so it
 * survives reloads, and announced with a window event so open line lists
 * refetch without a reload. */
export type TotalsMode = 'off' | 'fake' | 'fake-large'

const STORAGE_KEY = 'll-pagination-totals'
const CHANGE_EVENT = 'll-pagination-totals-change'

const FAKE_TOTALS: Record<'fake' | 'fake-large', number> = {
    fake: 1234,
    'fake-large': 24700,
}

const STORED_VALUES: Record<TotalsMode, string | null> = {
    off: null,
    fake: 'fake',
    'fake-large': 'fake:24700',
}

const readStoredValue = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

export const getTotalsMode = (): TotalsMode => {
    const storedValue = readStoredValue()
    if (storedValue === 'fake:24700') {
        return 'fake-large'
    }
    if (storedValue?.startsWith('fake')) {
        return 'fake'
    }
    return 'off'
}

export const setTotalsMode = (mode: TotalsMode): void => {
    try {
        const storedValue = STORED_VALUES[mode]
        if (storedValue === null) {
            localStorage.removeItem(STORAGE_KEY)
        } else {
            localStorage.setItem(STORAGE_KEY, storedValue)
        }
    } catch {
        return
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const getFakeTotal = (): number | null => {
    const mode = getTotalsMode()
    return mode === 'fake' || mode === 'fake-large' ? FAKE_TOTALS[mode] : null
}

export const useTotalsMode = (): TotalsMode => {
    const [mode, setMode] = useState(getTotalsMode)

    useEffect(() => {
        const onChange = () => setMode(getTotalsMode())
        window.addEventListener(CHANGE_EVENT, onChange)
        return () => window.removeEventListener(CHANGE_EVENT, onChange)
    }, [])

    return mode
}
