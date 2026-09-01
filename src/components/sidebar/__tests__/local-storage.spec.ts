import { describe, expect, it } from 'vitest'
import { SIDEBAR_STORAGE_KEY } from '../constants'
import {
    getSidebarWidthFromLocalStorage,
    setSidebarWidthToLocalStorage,
} from '../local-storage'

describe('sidebar width local storage', () => {
    it('returns undefined when nothing is stored', () => {
        expect(getSidebarWidthFromLocalStorage()).toBeUndefined()
    })

    it('returns undefined when the stored value is not a number', () => {
        globalThis.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'wide')

        expect(getSidebarWidthFromLocalStorage()).toBeUndefined()
    })

    it('returns the stored width', () => {
        setSidebarWidthToLocalStorage(480)

        expect(getSidebarWidthFromLocalStorage()).toBe(480)
    })

    it('stores a fractional width rounded', () => {
        setSidebarWidthToLocalStorage(480.6)

        expect(getSidebarWidthFromLocalStorage()).toBe(481)
    })
})
