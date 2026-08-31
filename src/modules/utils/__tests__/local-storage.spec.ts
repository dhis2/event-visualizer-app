import {
    readLocalStorage,
    removeLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import { afterEach, describe, expect, it, vi } from 'vitest'

const KEY = 'test-key'

/* A browser that blocks site data throws on every access, not just one
 * method. Stubbing the global is the only interception jsdom honours — its
 * localStorage is proxied, so spying on the methods does nothing. */
const blockSiteData = () => {
    const throwBlocked = () => {
        throw new Error('site data blocked')
    }

    vi.stubGlobal('localStorage', {
        getItem: throwBlocked,
        setItem: throwBlocked,
        removeItem: throwBlocked,
    })
}

describe('local storage access', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('reads back a written value', () => {
        writeLocalStorage(KEY, 'stored')

        expect(readLocalStorage(KEY)).toBe('stored')
    })

    it('reads null for an absent key', () => {
        expect(readLocalStorage(KEY)).toBeNull()
    })

    it('reads null again once the key is removed', () => {
        writeLocalStorage(KEY, 'stored')
        removeLocalStorage(KEY)

        expect(readLocalStorage(KEY)).toBeNull()
    })

    it('reads null when access is blocked', () => {
        blockSiteData()

        expect(readLocalStorage(KEY)).toBeNull()
    })

    it('swallows a blocked write', () => {
        blockSiteData()

        expect(() => writeLocalStorage(KEY, 'stored')).not.toThrow()
    })

    it('swallows a blocked remove', () => {
        blockSiteData()

        expect(() => removeLocalStorage(KEY)).not.toThrow()
    })
})
