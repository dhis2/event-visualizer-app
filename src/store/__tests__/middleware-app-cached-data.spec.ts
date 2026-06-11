import type { UnknownAction } from '@reduxjs/toolkit'
import type { AppCachedData } from '@types'
import { describe, it, expect, vi } from 'vitest'
import {
    createAppCachedDataMiddleware,
    getAppCachedDataFromAction,
} from '../middleware-app-cached-data'

const appCachedData = {
    systemSettings: { relativePeriod: 'LAST_12_MONTHS' },
} as unknown as AppCachedData

const runMiddleware = (action: unknown) => {
    const next = vi.fn((a: unknown) => a)
    const dispatched = createAppCachedDataMiddleware(appCachedData)(
        {} as never
    )(next)(action)
    return { next, dispatched }
}

describe('createAppCachedDataMiddleware', () => {
    it('stamps appCachedData onto a plain action meta', () => {
        const { next } = runMiddleware({ type: 'test/action' })
        const stamped = next.mock.calls[0][0] as UnknownAction
        expect(getAppCachedDataFromAction(stamped)).toBe(appCachedData)
    })

    it('preserves existing meta', () => {
        const { next } = runMiddleware({
            type: 'test/action',
            meta: { requestId: 'abc' },
        })
        const stamped = next.mock.calls[0][0] as UnknownAction
        expect(stamped.meta).toMatchObject({
            requestId: 'abc',
            appCachedData,
        })
    })

    it('passes non-actions (e.g. thunks) through untouched', () => {
        const thunk = () => undefined
        const { next, dispatched } = runMiddleware(thunk)
        expect(next.mock.calls[0][0]).toBe(thunk)
        expect(dispatched).toBe(thunk)
    })
})

describe('getAppCachedDataFromAction', () => {
    it('returns undefined when meta is absent', () => {
        expect(
            getAppCachedDataFromAction({ type: 'test/action' })
        ).toBeUndefined()
    })
})
