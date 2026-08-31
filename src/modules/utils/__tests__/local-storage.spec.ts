import {
    readLocalStorage,
    removeLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import { afterEach, describe, expect, it, vi } from 'vitest'

const KEY = 'test-key'

const throwOn = (method: 'getItem' | 'setItem' | 'removeItem') => {
    vi.spyOn(globalThis.localStorage, method).mockImplementation(() => {
        throw new Error('site data blocked')
    })
}

describe('local storage access', () => {
    afterEach(() => {
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

    it('reads null when access throws', () => {
        throwOn('getItem')

        expect(readLocalStorage(KEY)).toBeNull()
    })

    it('swallows a throwing write', () => {
        throwOn('setItem')

        expect(() => writeLocalStorage(KEY, 'stored')).not.toThrow()
    })

    it('swallows a throwing remove', () => {
        throwOn('removeItem')

        expect(() => removeLocalStorage(KEY)).not.toThrow()
    })
})
