import { logger } from '@modules/logger'
import {
    readLocalStorage,
    removeLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const isDebugMode = vi.hoisted(() => vi.fn(() => false))

vi.mock('@modules/debug-mode', () => ({
    isDebugMode,
    getLogLevel: () => 'silent',
}))

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

const spyOnLoggedError = () =>
    vi.spyOn(logger, 'error').mockImplementation(() => {})

describe('local storage access', () => {
    beforeEach(() => {
        isDebugMode.mockReturnValue(false)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
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

    it('stays quiet about a blocked access outside debug mode', () => {
        const error = spyOnLoggedError()
        blockSiteData()

        readLocalStorage(KEY)

        expect(error).not.toHaveBeenCalled()
    })

    it('reports a blocked access in debug mode', () => {
        isDebugMode.mockReturnValue(true)
        const error = spyOnLoggedError()
        blockSiteData()

        writeLocalStorage(KEY, 'stored')

        expect(error).toHaveBeenCalledOnce()
        expect(error.mock.calls[0][0]).toContain(KEY)
    })
})
